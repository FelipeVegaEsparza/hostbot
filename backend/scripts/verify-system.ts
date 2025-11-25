#!/usr/bin/env ts-node

/**
 * System Verification Script
 * Verifies that all base system components are properly configured and accessible
 * Requirements: 2.1, 8.2
 */

import { createConnection } from 'mysql2/promise';
import Redis from 'ioredis';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface VerificationResult {
  component: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logResult(result: VerificationResult) {
  const icon = result.status === 'OK' ? '✓' : result.status === 'ERROR' ? '✗' : '⚠';
  const color = result.status === 'OK' ? colors.green : result.status === 'ERROR' ? colors.red : colors.yellow;
  
  log(`${icon} ${result.component}: ${result.message}`, color);
  if (result.details) {
    console.log('  Details:', result.details);
  }
}

/**
 * Verify Redis connection and accessibility
 */
async function verifyRedis(): Promise<void> {
  log('\n📦 Verificando Redis...', colors.blue);
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  let redis: Redis | null = null;
  
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      },
    });

    // Test connection with ping
    const startTime = Date.now();
    const pong = await redis.ping();
    const latency = Date.now() - startTime;
    
    if (pong === 'PONG') {
      results.push({
        component: 'Redis Connection',
        status: 'OK',
        message: `Conectado exitosamente (latencia: ${latency}ms)`,
        details: { url: redisUrl, latency: `${latency}ms` },
      });

      // Test basic operations
      await redis.set('test:verification', 'ok', 'EX', 10);
      const value = await redis.get('test:verification');
      
      if (value === 'ok') {
        results.push({
          component: 'Redis Operations',
          status: 'OK',
          message: 'Operaciones básicas funcionando correctamente',
        });
      } else {
        results.push({
          component: 'Redis Operations',
          status: 'ERROR',
          message: 'Error en operaciones básicas',
        });
      }
      
      await redis.del('test:verification');
    }
  } catch (error) {
    results.push({
      component: 'Redis Connection',
      status: 'ERROR',
      message: `No se pudo conectar a Redis: ${error.message}`,
      details: { url: redisUrl, error: error.message },
    });
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
}

/**
 * Verify database connection and accessibility
 */
async function verifyDatabase(): Promise<void> {
  log('\n🗄️  Verificando Base de Datos...', colors.blue);
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    results.push({
      component: 'Database Configuration',
      status: 'ERROR',
      message: 'DATABASE_URL no está configurada en .env',
    });
    return;
  }

  let connection = null;
  
  try {
    // Parse MySQL connection string
    const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    
    if (!urlMatch) {
      results.push({
        component: 'Database Configuration',
        status: 'ERROR',
        message: 'Formato de DATABASE_URL inválido',
        details: { url: databaseUrl },
      });
      return;
    }

    const [, user, password, host, port, database] = urlMatch;

    connection = await createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      connectTimeout: 5000,
    });

    results.push({
      component: 'Database Connection',
      status: 'OK',
      message: 'Conectado exitosamente',
      details: { host, port, database, user },
    });

    // Test basic query
    const [rows] = await connection.execute('SELECT 1 as test');
    
    if (Array.isArray(rows) && rows.length > 0) {
      results.push({
        component: 'Database Operations',
        status: 'OK',
        message: 'Consultas funcionando correctamente',
      });
    }

    // Check if tables exist
    const [tables] = await connection.execute(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?',
      [database]
    );
    
    const tableCount = (tables as any)[0].count;
    
    if (tableCount > 0) {
      results.push({
        component: 'Database Schema',
        status: 'OK',
        message: `Schema inicializado (${tableCount} tablas encontradas)`,
        details: { tableCount },
      });
    } else {
      results.push({
        component: 'Database Schema',
        status: 'WARNING',
        message: 'No se encontraron tablas. Ejecutar: npm run prisma:migrate',
      });
    }
  } catch (error) {
    results.push({
      component: 'Database Connection',
      status: 'ERROR',
      message: `No se pudo conectar a la base de datos: ${error.message}`,
      details: { error: error.message },
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Verify WhatsApp QR Service accessibility
 */
async function verifyWhatsAppQRService(): Promise<void> {
  log('\n📱 Verificando WhatsApp QR Service...', colors.blue);
  
  const serviceUrl = process.env.WHATSAPP_QR_SERVICE_URL;
  
  if (!serviceUrl) {
    results.push({
      component: 'WhatsApp QR Service Configuration',
      status: 'WARNING',
      message: 'WHATSAPP_QR_SERVICE_URL no está configurada (opcional si no se usa WhatsApp QR)',
    });
    return;
  }

  try {
    const healthUrl = `${serviceUrl}/health`;
    const response = await axios.get(healthUrl, { timeout: 5000 });
    
    if (response.status === 200) {
      results.push({
        component: 'WhatsApp QR Service',
        status: 'OK',
        message: 'Servicio accesible y funcionando',
        details: { url: serviceUrl, health: response.data },
      });
    } else {
      results.push({
        component: 'WhatsApp QR Service',
        status: 'WARNING',
        message: `Servicio respondió con status ${response.status}`,
        details: { url: serviceUrl, status: response.status },
      });
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      results.push({
        component: 'WhatsApp QR Service',
        status: 'WARNING',
        message: 'Servicio no está corriendo (opcional si no se usa WhatsApp QR)',
        details: { url: serviceUrl, error: 'Connection refused' },
      });
    } else {
      results.push({
        component: 'WhatsApp QR Service',
        status: 'WARNING',
        message: `No se pudo conectar al servicio: ${error.message}`,
        details: { url: serviceUrl, error: error.message },
      });
    }
  }
}

/**
 * Verify required environment variables
 */
function verifyEnvironmentVariables(): void {
  log('\n🔧 Verificando Variables de Entorno...', colors.blue);
  
  const requiredVars = [
    { name: 'DATABASE_URL', critical: true },
    { name: 'REDIS_URL', critical: true },
    { name: 'JWT_SECRET', critical: true },
    { name: 'API_PORT', critical: false },
    { name: 'NODE_ENV', critical: false },
    { name: 'ALLOWED_ORIGINS', critical: true },
  ];

  const optionalVars = [
    { name: 'OPENAI_API_KEY', description: 'OpenAI provider' },
    { name: 'ANTHROPIC_API_KEY', description: 'Anthropic provider' },
    { name: 'GROQ_API_KEY', description: 'Groq provider' },
    { name: 'WHATSAPP_QR_SERVICE_URL', description: 'WhatsApp QR integration' },
  ];

  let missingCritical = 0;
  let missingOptional = 0;

  // Check required variables
  for (const { name, critical } of requiredVars) {
    const value = process.env[name];
    
    if (!value || value.trim() === '') {
      if (critical) {
        missingCritical++;
        results.push({
          component: `Environment Variable: ${name}`,
          status: 'ERROR',
          message: 'Variable crítica no configurada',
        });
      } else {
        results.push({
          component: `Environment Variable: ${name}`,
          status: 'WARNING',
          message: 'Variable no configurada (usando valor por defecto)',
        });
      }
    } else {
      // Mask sensitive values
      const displayValue = name.includes('SECRET') || name.includes('KEY') || name.includes('PASSWORD')
        ? '***' + value.slice(-4)
        : value;
      
      results.push({
        component: `Environment Variable: ${name}`,
        status: 'OK',
        message: 'Configurada correctamente',
        details: { value: displayValue },
      });
    }
  }

  // Check optional variables
  for (const { name, description } of optionalVars) {
    const value = process.env[name];
    
    if (!value || value.trim() === '') {
      missingOptional++;
      results.push({
        component: `Environment Variable: ${name}`,
        status: 'WARNING',
        message: `No configurada (${description})`,
      });
    } else {
      const displayValue = name.includes('KEY') ? '***' + value.slice(-4) : value;
      results.push({
        component: `Environment Variable: ${name}`,
        status: 'OK',
        message: 'Configurada correctamente',
        details: { value: displayValue },
      });
    }
  }

  // Summary
  if (missingCritical > 0) {
    results.push({
      component: 'Environment Variables Summary',
      status: 'ERROR',
      message: `${missingCritical} variable(s) crítica(s) faltante(s)`,
    });
  } else if (missingOptional > 0) {
    results.push({
      component: 'Environment Variables Summary',
      status: 'WARNING',
      message: `Todas las variables críticas configuradas. ${missingOptional} opcional(es) faltante(s)`,
    });
  } else {
    results.push({
      component: 'Environment Variables Summary',
      status: 'OK',
      message: 'Todas las variables configuradas correctamente',
    });
  }
}

/**
 * Main verification function
 */
async function main() {
  log(`${colors.bold}═══════════════════════════════════════════════════════`, colors.blue);
  log(`${colors.bold}  Sistema de Verificación de Configuración Base`, colors.blue);
  log(`${colors.bold}═══════════════════════════════════════════════════════${colors.reset}`, colors.blue);
  
  // Run all verifications
  verifyEnvironmentVariables();
  await verifyRedis();
  await verifyDatabase();
  await verifyWhatsAppQRService();
  
  // Print results
  log(`\n${colors.bold}═══════════════════════════════════════════════════════`, colors.blue);
  log(`${colors.bold}  Resultados de Verificación`, colors.blue);
  log(`${colors.bold}═══════════════════════════════════════════════════════${colors.reset}`, colors.blue);
  
  results.forEach(logResult);
  
  // Summary
  const okCount = results.filter(r => r.status === 'OK').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  
  log(`\n${colors.bold}═══════════════════════════════════════════════════════`, colors.blue);
  log(`${colors.bold}  Resumen`, colors.blue);
  log(`${colors.bold}═══════════════════════════════════════════════════════${colors.reset}`, colors.blue);
  
  log(`${colors.green}✓ OK: ${okCount}${colors.reset}`);
  log(`${colors.yellow}⚠ Advertencias: ${warningCount}${colors.reset}`);
  log(`${colors.red}✗ Errores: ${errorCount}${colors.reset}`);
  
  if (errorCount > 0) {
    log(`\n${colors.red}${colors.bold}❌ Sistema NO está listo para operar${colors.reset}`);
    log(`${colors.red}Por favor, corrija los errores antes de continuar.${colors.reset}`);
    process.exit(1);
  } else if (warningCount > 0) {
    log(`\n${colors.yellow}${colors.bold}⚠️  Sistema operacional con advertencias${colors.reset}`);
    log(`${colors.yellow}Algunas funcionalidades opcionales pueden no estar disponibles.${colors.reset}`);
    process.exit(0);
  } else {
    log(`\n${colors.green}${colors.bold}✅ Sistema completamente configurado y listo para operar${colors.reset}`);
    process.exit(0);
  }
}

// Run verification
main().catch((error) => {
  log(`\n${colors.red}${colors.bold}Error fatal durante la verificación:${colors.reset}`, colors.red);
  console.error(error);
  process.exit(1);
});

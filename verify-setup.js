#!/usr/bin/env node

/**
 * Script de verificación de configuración
 * Verifica que todos los servicios y configuraciones estén correctos
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}: ${filePath}`, 'green');
    return true;
  } else {
    log(`❌ ${description} no encontrado: ${filePath}`, 'red');
    return false;
  }
}

function checkEnvVariable(filePath, variable, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ Archivo ${filePath} no existe`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`^${variable}=.+`, 'm');
  
  if (regex.test(content)) {
    log(`✅ ${description}: ${variable} configurado`, 'green');
    return true;
  } else {
    log(`⚠️  ${description}: ${variable} no configurado o vacío`, 'yellow');
    return false;
  }
}

function checkDockerContainer(containerName) {
  try {
    const output = execSync(`docker ps --filter "name=${containerName}" --format "{{.Status}}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (output.includes('Up')) {
      log(`✅ Docker: ${containerName} está corriendo`, 'green');
      return true;
    } else {
      log(`❌ Docker: ${containerName} no está corriendo`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Docker: No se pudo verificar ${containerName}`, 'red');
    return false;
  }
}

function checkPort(port, service) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (output) {
      log(`⚠️  Puerto ${port} (${service}) está en uso`, 'yellow');
      return false;
    } else {
      log(`✅ Puerto ${port} (${service}) está disponible`, 'green');
      return true;
    }
  } catch (error) {
    log(`✅ Puerto ${port} (${service}) está disponible`, 'green');
    return true;
  }
}

async function main() {
  log('\n🔍 Verificando configuración del sistema...\n', 'cyan');

  let allGood = true;

  // Verificar archivos .env
  log('📁 Verificando archivos de configuración:', 'blue');
  allGood &= checkFile('backend/.env', 'Backend .env');
  allGood &= checkFile('dashboard/.env', 'Dashboard .env');
  allGood &= checkFile('whatsapp-qr-service/.env', 'WhatsApp QR .env');
  allGood &= checkFile('widget/.env', 'Widget .env');

  log('\n🔐 Verificando variables de entorno críticas:', 'blue');
  
  // Backend
  allGood &= checkEnvVariable('backend/.env', 'DATABASE_URL', 'Backend');
  allGood &= checkEnvVariable('backend/.env', 'REDIS_URL', 'Backend');
  allGood &= checkEnvVariable('backend/.env', 'JWT_SECRET', 'Backend');
  allGood &= checkEnvVariable('backend/.env', 'OPENAI_API_KEY', 'Backend');
  
  // Dashboard
  allGood &= checkEnvVariable('dashboard/.env', 'NEXT_PUBLIC_API_URL', 'Dashboard');
  
  // WhatsApp QR
  allGood &= checkEnvVariable('whatsapp-qr-service/.env', 'BACKEND_URL', 'WhatsApp QR');
  
  // Widget
  allGood &= checkEnvVariable('widget/.env', 'PUBLIC_API_URL', 'Widget');

  log('\n🐳 Verificando contenedores Docker:', 'blue');
  const mysqlRunning = checkDockerContainer('chatbot-mysql');
  const redisRunning = checkDockerContainer('chatbot-redis');
  allGood &= mysqlRunning && redisRunning;

  if (!mysqlRunning || !redisRunning) {
    log('\n💡 Para iniciar MySQL y Redis:', 'yellow');
    log('   docker-compose up -d mysql redis', 'cyan');
  }

  log('\n🔌 Verificando puertos disponibles:', 'blue');
  checkPort(3000, 'Backend API');
  checkPort(3001, 'WhatsApp QR Service');
  checkPort(3002, 'Dashboard');
  checkPort(4321, 'Widget');

  log('\n📦 Verificando dependencias:', 'blue');
  const dirs = ['backend', 'dashboard', 'whatsapp-qr-service', 'widget'];
  
  for (const dir of dirs) {
    if (fs.existsSync(path.join(dir, 'node_modules'))) {
      log(`✅ ${dir}: node_modules instalado`, 'green');
    } else {
      log(`❌ ${dir}: node_modules no encontrado`, 'red');
      log(`   Ejecuta: cd ${dir} && npm install`, 'yellow');
      allGood = false;
    }
  }

  // Verificar Prisma
  log('\n🗄️  Verificando Prisma:', 'blue');
  if (fs.existsSync('backend/node_modules/.prisma/client')) {
    log('✅ Prisma Client generado', 'green');
  } else {
    log('❌ Prisma Client no generado', 'red');
    log('   Ejecuta: cd backend && npm run prisma:generate', 'yellow');
    allGood = false;
  }

  // Verificar migraciones
  if (fs.existsSync('backend/prisma/migrations')) {
    const migrations = fs.readdirSync('backend/prisma/migrations');
    if (migrations.length > 1) { // Más de solo el directorio migration_lock
      log(`✅ Migraciones aplicadas (${migrations.length - 1} migraciones)`, 'green');
    } else {
      log('⚠️  No hay migraciones aplicadas', 'yellow');
      log('   Ejecuta: cd backend && npm run prisma:migrate', 'yellow');
    }
  }

  // Resumen
  log('\n' + '='.repeat(60), 'cyan');
  if (allGood) {
    log('✅ ¡Todo está configurado correctamente!', 'green');
    log('\n📚 Próximos pasos:', 'blue');
    log('   1. Revisa START_LOCAL.md para iniciar los servicios', 'cyan');
    log('   2. Abre 4 terminales y ejecuta cada servicio', 'cyan');
    log('   3. Accede al dashboard en http://localhost:3002', 'cyan');
  } else {
    log('⚠️  Hay algunos problemas que necesitan atención', 'yellow');
    log('\n📚 Revisa los mensajes anteriores y:', 'blue');
    log('   1. Corrige los problemas indicados', 'cyan');
    log('   2. Ejecuta este script nuevamente', 'cyan');
    log('   3. Consulta ENV_CONFIGURATION.md para más detalles', 'cyan');
  }
  log('='.repeat(60) + '\n', 'cyan');
}

main().catch(console.error);

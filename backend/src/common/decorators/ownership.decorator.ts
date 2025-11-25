import { SetMetadata } from '@nestjs/common';
import { OWNERSHIP_KEY, OwnershipConfig } from '../guards/ownership.guard';

export const CheckOwnership = (config: OwnershipConfig) => SetMetadata(OWNERSHIP_KEY, config);

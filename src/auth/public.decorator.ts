import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Marca una operación que no exige JWT (solo register y login). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

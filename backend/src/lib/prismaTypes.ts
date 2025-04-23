import { Prisma } from './prisma';

// Define missing types for Prisma
export namespace PrismaCustomTypes {
  export type EpsRecordUpdateInput = {
    symbol?: string;
    reportDate?: Date;
    eps?: number | null;
    epsNganh?: number | null;
    epsRate?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    stock?: any;
  };

  export type PeRecordUpdateInput = {
    symbol?: string;
    reportDate?: Date;
    pe?: number | null;
    peNganh?: number | null;
    peRate?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    stock?: any;
  };

  export type RoaRoeRecordUpdateInput = {
    symbol?: string;
    reportDate?: Date;
    roa?: number | null;
    roe?: number | null;
    roeNganh?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    stock?: any;
  };

  export type FinancialRatioRecordUpdateInput = {
    symbol?: string;
    reportDate?: Date;
    debtEquity?: number | null;
    assetsEquity?: number | null;
    debtEquityPct?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    stock?: any;
  };

  export type EpsRecordWhereInput = {
    AND?: EpsRecordWhereInput | EpsRecordWhereInput[];
    OR?: EpsRecordWhereInput[];
    NOT?: EpsRecordWhereInput | EpsRecordWhereInput[];
    id?: Prisma.BigIntFilter;
    symbol?: Prisma.StringFilter;
    reportDate?: Prisma.DateTimeFilter;
    eps?: any;
    epsNganh?: any;
    epsRate?: any;
    createdAt?: Prisma.DateTimeFilter;
    updatedAt?: Prisma.DateTimeFilter;
    stock?: any;
  };

  export type PeRecordWhereInput = {
    AND?: PeRecordWhereInput | PeRecordWhereInput[];
    OR?: PeRecordWhereInput[];
    NOT?: PeRecordWhereInput | PeRecordWhereInput[];
    id?: Prisma.BigIntFilter;
    symbol?: Prisma.StringFilter;
    reportDate?: Prisma.DateTimeFilter;
    pe?: any;
    peNganh?: any;
    peRate?: any;
    createdAt?: Prisma.DateTimeFilter;
    updatedAt?: Prisma.DateTimeFilter;
    stock?: any;
  };

  export type RoaRoeRecordWhereInput = {
    AND?: RoaRoeRecordWhereInput | RoaRoeRecordWhereInput[];
    OR?: RoaRoeRecordWhereInput[];
    NOT?: RoaRoeRecordWhereInput | RoaRoeRecordWhereInput[];
    id?: Prisma.BigIntFilter;
    symbol?: Prisma.StringFilter;
    reportDate?: Prisma.DateTimeFilter;
    roa?: any;
    roe?: any;
    roeNganh?: any;
    createdAt?: Prisma.DateTimeFilter;
    updatedAt?: Prisma.DateTimeFilter;
    stock?: any;
  };

  export type FinancialRatioRecordWhereInput = {
    AND?: FinancialRatioRecordWhereInput | FinancialRatioRecordWhereInput[];
    OR?: FinancialRatioRecordWhereInput[];
    NOT?: FinancialRatioRecordWhereInput | FinancialRatioRecordWhereInput[];
    id?: Prisma.BigIntFilter;
    symbol?: Prisma.StringFilter;
    reportDate?: Prisma.DateTimeFilter;
    debtEquity?: any;
    assetsEquity?: any;
    debtEquityPct?: any;
    createdAt?: Prisma.DateTimeFilter;
    updatedAt?: Prisma.DateTimeFilter;
    stock?: any;
  };
} 
-- CreateTable
CREATE TABLE `eps_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `symbol` VARCHAR(20) NOT NULL,
    `report_date` DATE NOT NULL,
    `eps` DOUBLE NULL,
    `eps_nganh` DOUBLE NULL,
    `eps_rate` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `eps_records_symbol_idx`(`symbol`),
    INDEX `eps_records_report_date_idx`(`report_date`),
    UNIQUE INDEX `eps_records_symbol_report_date_key`(`symbol`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pe_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `symbol` VARCHAR(20) NOT NULL,
    `report_date` DATE NOT NULL,
    `pe` DOUBLE NULL,
    `pe_nganh` DOUBLE NULL,
    `pe_rate` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pe_records_symbol_idx`(`symbol`),
    INDEX `pe_records_report_date_idx`(`report_date`),
    UNIQUE INDEX `pe_records_symbol_report_date_key`(`symbol`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roa_roe_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `symbol` VARCHAR(20) NOT NULL,
    `report_date` DATE NOT NULL,
    `roa` DOUBLE NULL,
    `roe` DOUBLE NULL,
    `roe_nganh` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `roa_roe_records_symbol_idx`(`symbol`),
    INDEX `roa_roe_records_report_date_idx`(`report_date`),
    UNIQUE INDEX `roa_roe_records_symbol_report_date_key`(`symbol`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_ratio_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `symbol` VARCHAR(20) NOT NULL,
    `report_date` DATE NOT NULL,
    `debt_equity` DOUBLE NULL,
    `assets_equity` DOUBLE NULL,
    `debt_equity_pct` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `financial_ratio_records_symbol_idx`(`symbol`),
    INDEX `financial_ratio_records_report_date_idx`(`report_date`),
    UNIQUE INDEX `financial_ratio_records_symbol_report_date_key`(`symbol`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `eps_records` ADD CONSTRAINT `eps_records_symbol_fkey` FOREIGN KEY (`symbol`) REFERENCES `stocks`(`symbol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pe_records` ADD CONSTRAINT `pe_records_symbol_fkey` FOREIGN KEY (`symbol`) REFERENCES `stocks`(`symbol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roa_roe_records` ADD CONSTRAINT `roa_roe_records_symbol_fkey` FOREIGN KEY (`symbol`) REFERENCES `stocks`(`symbol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_ratio_records` ADD CONSTRAINT `financial_ratio_records_symbol_fkey` FOREIGN KEY (`symbol`) REFERENCES `stocks`(`symbol`) ON DELETE RESTRICT ON UPDATE CASCADE;

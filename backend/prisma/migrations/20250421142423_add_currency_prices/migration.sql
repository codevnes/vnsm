-- CreateTable
CREATE TABLE `currency_prices` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `symbol` VARCHAR(20) NOT NULL,
    `date` DATE NOT NULL,
    `open` DECIMAL(15, 5) NOT NULL,
    `high` DECIMAL(15, 5) NOT NULL,
    `low` DECIMAL(15, 5) NOT NULL,
    `close` DECIMAL(15, 5) NOT NULL,
    `trend_q` DECIMAL(15, 10) NOT NULL,
    `fq` DECIMAL(15, 10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `currency_prices_symbol_idx`(`symbol`),
    INDEX `currency_prices_date_idx`(`date`),
    UNIQUE INDEX `currency_prices_symbol_date_key`(`symbol`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

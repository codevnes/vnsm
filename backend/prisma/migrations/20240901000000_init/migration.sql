-- CreateTable
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'editor', 'user') NOT NULL DEFAULT 'user',
  `thumbnail` VARCHAR(255) NULL,
  `verified` BOOLEAN NULL DEFAULT false,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `thumbnail` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `parent` BIGINT UNSIGNED NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `categories_slug_key`(`slug`),
  INDEX `categories_parent_fkey`(`parent`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stocks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `symbol` VARCHAR(20) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `exchange` VARCHAR(100) NULL,
  `industry` VARCHAR(100) NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `stocks_symbol_key`(`symbol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `content` LONGTEXT NULL,
  `thumbnail` VARCHAR(255) NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `stock_id` BIGINT UNSIGNED NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `posts_slug_key`(`slug`),
  INDEX `posts_category_id_fkey`(`category_id`),
  INDEX `posts_stock_id_fkey`(`stock_id`),
  INDEX `posts_user_id_fkey`(`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `filename` VARCHAR(191) NOT NULL,
  `processedFilename` VARCHAR(191) NOT NULL,
  `path` VARCHAR(191) NOT NULL,
  `url` VARCHAR(191) NOT NULL,
  `altText` VARCHAR(191) NULL,
  `mimetype` VARCHAR(191) NULL,
  `size` INTEGER NULL,
  `width` INTEGER NULL,
  `height` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `Image_url_key`(`url`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_qindex` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stock_id` BIGINT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `open` DECIMAL(15, 5) NULL,
  `low` DECIMAL(15, 5) NULL,
  `high` DECIMAL(15, 5) NULL,
  `close` DECIMAL(15, 5) NULL,
  `trend_q` DECIMAL(15, 5) NULL,
  `fq` DECIMAL(15, 5) NULL,
  `qv1` BIGINT NULL,
  `band_down` DECIMAL(15, 5) NULL,
  `band_up` DECIMAL(15, 5) NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `stock_qindex_stock_id_date_key`(`stock_id`, `date`),
  INDEX `stock_qindex_stock_id_idx`(`stock_id`),
  INDEX `stock_qindex_date_idx`(`date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_fkey` FOREIGN KEY (`parent`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_stock_id_fkey` FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_qindex` ADD CONSTRAINT `stock_qindex_stock_id_fkey` FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
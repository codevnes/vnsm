/*
  Rename column `roe_nganh_rate` to `roa_nganh` on the `roa_roe_records` table
  and transfer all existing data.
*/

-- First add the new column
ALTER TABLE `roa_roe_records` ADD COLUMN `roa_nganh` DOUBLE NULL;

-- Copy data from old column to new column
UPDATE `roa_roe_records` SET `roa_nganh` = `roe_nganh_rate`;

-- Drop the old column after data has been transferred
ALTER TABLE `roa_roe_records` DROP COLUMN `roe_nganh_rate`;

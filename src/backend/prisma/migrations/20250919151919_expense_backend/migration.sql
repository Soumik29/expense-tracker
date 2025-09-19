-- CreateTable
CREATE TABLE `Expense` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(10, 2) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `category` ENUM('Food', 'Groceries', 'Mobile_Bill', 'Travel', 'Shopping', 'Games', 'Subscription', 'EMI') NOT NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

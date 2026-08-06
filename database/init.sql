-- 羽球集 数据库初始化脚本
-- 云托管：Go AutoMigrate 会自动建表，此脚本仅用于本地 docker-compose 参考

CREATE DATABASE IF NOT EXISTS `yuqiuji` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `yuqiuji`;

-- 用户档案表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `open_id` VARCHAR(64) NOT NULL COMMENT '微信 openid',
  `nick_name` VARCHAR(64) DEFAULT '' COMMENT '昵称',
  `bio` VARCHAR(256) DEFAULT '' COMMENT '个人简介',
  `avatar_url` VARCHAR(512) DEFAULT '' COMMENT '头像URL',
  `skill_level` VARCHAR(32) DEFAULT '' COMMENT '技术水平',
  `play_years` VARCHAR(16) DEFAULT '' COMMENT '球龄',
  `play_frequency` VARCHAR(16) DEFAULT '' COMMENT '打球频率',
  `play_style` VARCHAR(16) DEFAULT '' COMMENT '打球类型',
  `main_racket` VARCHAR(128) DEFAULT '' COMMENT '主力球拍',
  `shoes` VARCHAR(128) DEFAULT '' COMMENT '球鞋',
  `shuttle_brand` VARCHAR(128) DEFAULT '' COMMENT '常用球品牌',
  `string_tension` INT DEFAULT 0 COMMENT '拉线磅数',
  `preferred_venue` VARCHAR(128) DEFAULT '' COMMENT '常用球馆',
  `city` VARCHAR(64) DEFAULT '' COMMENT '所在城市',
  `play_type` VARCHAR(64) DEFAULT '' COMMENT '擅长打法',
  `hand` VARCHAR(16) DEFAULT '' COMMENT '惯用手',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`open_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 记账记录（多项目模式）
CREATE TABLE IF NOT EXISTS `bill_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `open_id` VARCHAR(64) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `item_count` INT NOT NULL DEFAULT 0,
  `date` DATETIME NOT NULL,
  `note` VARCHAR(512) DEFAULT '',
  `activity_id` BIGINT UNSIGNED DEFAULT 0,
  `activity_label` VARCHAR(128) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid` (`open_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 费用明细
CREATE TABLE IF NOT EXISTS `bill_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT UNSIGNED NOT NULL,
  `category` VARCHAR(32) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 活动表
CREATE TABLE IF NOT EXISTS `activities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `open_id` VARCHAR(64) NOT NULL,
  `date` DATETIME NOT NULL,
  `duration` INT NOT NULL DEFAULT 0 COMMENT '运动时长（分钟）',
  `location` VARCHAR(128) DEFAULT '',
  `player_count` INT DEFAULT 0,
  `note` VARCHAR(512) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid` (`open_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

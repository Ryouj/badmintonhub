-- 羽球集 数据库初始化脚本
-- 云托管 MySQL 会自动执行此脚本（也可手动导入）

CREATE DATABASE IF NOT EXISTS `yuqiuji` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `yuqiuji`;

-- 用户档案表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `open_id` VARCHAR(64) NOT NULL COMMENT '微信 openid',
  `nick_name` VARCHAR(64) DEFAULT '' COMMENT '昵称',
  `bio` VARCHAR(256) DEFAULT '' COMMENT '个人简介',
  `avatar_url` VARCHAR(512) DEFAULT '' COMMENT '头像URL',
  `skill_level` VARCHAR(32) DEFAULT '' COMMENT '技术水平 (beginner/elementary/intermediate/advanced/expert)',
  `play_years` VARCHAR(16) DEFAULT '' COMMENT '球龄 (0-1/1-3/3-5/5-10/10+)',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户档案';

-- 账单表
CREATE TABLE IF NOT EXISTS `bills` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `open_id` VARCHAR(64) NOT NULL COMMENT '微信 openid',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `category` VARCHAR(32) NOT NULL DEFAULT 'other' COMMENT '类别 (court/shuttle/drink/stringing/equipment/other)',
  `date` DATETIME NOT NULL COMMENT '日期时间',
  `note` VARCHAR(512) DEFAULT '' COMMENT '备注',
  `activity_id` BIGINT UNSIGNED DEFAULT 0 COMMENT '关联活动ID',
  `activity_label` VARCHAR(128) DEFAULT '' COMMENT '关联活动显示文本',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid` (`open_id`),
  KEY `idx_date` (`date`),
  KEY `idx_category` (`category`),
  KEY `idx_activity` (`activity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单记录';

-- 活动表
CREATE TABLE IF NOT EXISTS `activities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `open_id` VARCHAR(64) NOT NULL COMMENT '微信 openid',
  `date` DATETIME NOT NULL COMMENT '日期',
  `duration` INT NOT NULL DEFAULT 0 COMMENT '运动时长（分钟）',
  `location` VARCHAR(128) DEFAULT '' COMMENT '球馆名称',
  `player_count` INT DEFAULT 0 COMMENT '参与人数',
  `note` VARCHAR(512) DEFAULT '' COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid` (`open_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='羽毛球活动记录';

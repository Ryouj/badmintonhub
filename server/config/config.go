package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// MySQLConfig 数据库连接参数
type MySQLConfig struct {
	Address  string // host:port
	Username string
	Password string
	Database string
}

// Config 应用配置
type Config struct {
	Port      string
	AppSecret string
	AppID     string
	JWTSecret string
}

var AppConfig Config

func Init() {
	AppConfig = Config{
		Port:      getEnv("PORT", "8080"),
		AppSecret: getEnv("WX_APP_SECRET", ""),
		AppID:     getEnv("WX_APP_ID", ""),
		JWTSecret: getEnv("JWT_SECRET", "yuqiuji-jwt-secret-2024"),
	}
	log.Printf("[Config] PORT=%s, WX_APP_ID=%s", AppConfig.Port, maskSecret(AppConfig.AppID))
}

func InitDB() {
	// 1. 收集数据库连接信息
	mc := resolveMySQLConfig()

	// 2. 先尝试创建数据库（云托管 MySQL 可能还没有这个库）
	createDatabaseIfNotExists(mc)

	// 3. 连接数据库（带重试 + TLS）
	connectWithRetry(mc)
}

// resolveMySQLConfig 解析 MySQL 连接参数
func resolveMySQLConfig() MySQLConfig {
	addr := os.Getenv("MYSQL_ADDRESS")
	user := os.Getenv("MYSQL_USERNAME")
	pass := os.Getenv("MYSQL_PASSWORD")
	db := os.Getenv("MYSQL_DATABASE")

	if addr != "" {
		if !strings.Contains(addr, ":") {
			addr = addr + ":3306"
		}
		if user == "" {
			user = "root"
		}
		if db == "" {
			db = "yuqiuji"
		}
		log.Printf("[DB] 云托管 MySQL → %s@%s/%s", user, addr, db)
		return MySQLConfig{Address: addr, Username: user, Password: pass, Database: db}
	}

	// 本地开发
	return MySQLConfig{
		Address:  getEnv("DB_HOST", "127.0.0.1") + ":" + getEnv("DB_PORT", "3306"),
		Username: getEnv("DB_USER", "root"),
		Password: getEnv("DB_PASS", "password"),
		Database: getEnv("DB_NAME", "yuqiuji"),
	}
}

// createDatabaseIfNotExists 在连接目标库之前先确保库存在
func createDatabaseIfNotExists(mc MySQLConfig) {
	// 不带 database 名的 DSN，只连 MySQL 服务器
	adminDSN := fmt.Sprintf("%s:%s@tcp(%s)/?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		mc.Username, mc.Password, mc.Address)

	db, err := sql.Open("mysql", adminDSN)
	if err != nil {
		log.Printf("[DB] 管理连接失败（库可能已存在，跳过）: %v", err)
		return
	}
	defer db.Close()

	db.SetConnMaxLifetime(5 * time.Second)
	db.SetMaxIdleConns(1)

	_, err = db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", mc.Database))
	if err != nil {
		log.Printf("[DB] 建库失败（如库已存在可忽略）: %v", err)
	} else {
		log.Printf("[DB] 数据库 `%s` 已就绪", mc.Database)
	}
}

// connectWithRetry 带重试的连接
func connectWithRetry(mc MySQLConfig) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		mc.Username, mc.Password, mc.Address, mc.Database)

	maxRetries := 10
	var err error
	for i := 0; i < maxRetries; i++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err == nil {
			log.Println("[DB] 数据库连接成功")
			sqlDB, _ := DB.DB()
			sqlDB.SetMaxIdleConns(10)
			sqlDB.SetMaxOpenConns(100)
			return
		}
		log.Printf("[DB] 第 %d/%d 次连接失败: %v，等待 5 秒...", i+1, maxRetries, err)
		time.Sleep(5 * time.Second)
	}

	panic(fmt.Sprintf("数据库连接失败（重试 %d 次）: %v", maxRetries, err))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func maskSecret(s string) string {
	if len(s) <= 4 {
		return "****"
	}
	return s[:2] + "****" + s[len(s)-2:]
}

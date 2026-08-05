package config

import (
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

// Config 应用配置
type Config struct {
	Port      string
	AppSecret string // 微信小程序 AppSecret（用于登录）
	AppID     string // 微信小程序 AppID
	JWTSecret string
}

var AppConfig Config

func Init() {
	// 从环境变量加载配置（云托管通过环境变量注入）
	AppConfig = Config{
		Port:      getEnv("PORT", "8080"),
		AppSecret: getEnv("WX_APP_SECRET", ""),
		AppID:     getEnv("WX_APP_ID", ""),
		JWTSecret: getEnv("JWT_SECRET", "yuqiuji-jwt-secret-2024"),
	}
}

func InitDB() {
	dsn := buildDSN()

	// 云托管环境 MySQL 可能需要几秒才能就绪，重试 5 次
	maxRetries := 5
	var err error
	for i := 0; i < maxRetries; i++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err == nil {
			break
		}
		log.Printf("[DB] 第 %d/%d 次连接失败: %v，3秒后重试...", i+1, maxRetries, err)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		panic(fmt.Sprintf("数据库连接失败（重试 %d 次）: %v", maxRetries, err))
	}

	sqlDB, _ := DB.DB()
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	log.Println("[DB] 数据库连接成功")
}

// buildDSN 构建 MySQL DSN
// 优先级：MYSQL_DSN > 云托管注入变量 > 本地默认值
func buildDSN() string {
	// 1. 如果用户直接配置了完整 DSN（本地开发或自定义场景）
	if dsn := os.Getenv("MYSQL_DSN"); dsn != "" {
		fmt.Println("[DB] 使用 MYSQL_DSN 环境变量")
		return dsn
	}

	// 2. 微信云托管自动注入的变量
	//    MYSQL_ADDRESS 格式: "host:port"（内网地址，不是 127.0.0.1）
	//    MYSQL_USERNAME / MYSQL_PASSWORD / MYSQL_DATABASE
	address := os.Getenv("MYSQL_ADDRESS")
	username := os.Getenv("MYSQL_USERNAME")
	password := os.Getenv("MYSQL_PASSWORD")
	database := os.Getenv("MYSQL_DATABASE")

	if address != "" {
		// 确保 address 是 host:port 格式
		if !strings.Contains(address, ":") {
			address = address + ":3306"
		}
		if username == "" {
			username = "root"
		}
		if database == "" {
			database = "yuqiuji"
		}
		dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			username, password, address, database)
		fmt.Printf("[DB] 使用云托管 MySQL: %s@tcp(%s)/%s\n", username, address, database)
		return dsn
	}

	// 3. 本地开发默认值（配合 docker-compose 使用）
	host := getEnv("DB_HOST", "127.0.0.1")
	port := getEnv("DB_PORT", "3306")
	user := getEnv("DB_USER", "root")
	pass := getEnv("DB_PASS", "password")
	dbname := getEnv("DB_NAME", "yuqiuji")
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		user, pass, host, port, dbname)
	fmt.Printf("[DB] 使用本地默认: %s@tcp(%s:%s)/%s\n", user, host, port, dbname)
	return dsn
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

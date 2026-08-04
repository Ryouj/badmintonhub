package config

import (
	"fmt"
	"os"

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
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		// 默认值，云托管会自动注入真实 DSN
		dsn = "root:password@tcp(127.0.0.1:3306)/yuqiuji?charset=utf8mb4&parseTime=True&loc=Local"
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		panic(fmt.Sprintf("数据库连接失败: %v", err))
	}

	sqlDB, _ := DB.DB()
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

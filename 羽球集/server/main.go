package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"yuqiuji-server/config"
	"yuqiuji-server/handlers"
	"yuqiuji-server/middleware"
	"yuqiuji-server/models"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化配置
	config.Init()
	config.InitDB()

	// 自动迁移表结构
	config.DB.AutoMigrate(
		&models.User{},
		&models.Bill{},
		&models.Activity{},
	)

	log.Println("数据库迁移完成")

	// 创建路由
	r := gin.Default()

	// CORS 中间件（允许小程序请求）
	r.Use(corsMiddleware())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "time": time.Now().Format("2006-01-02 15:04:05")})
	})

	// API 路由
	api := r.Group("/api")
	{
		// 公开接口
		api.POST("/login", handlers.Login)

		// 需要认证的接口
		auth := api.Group("")
		auth.Use(middleware.AuthRequired())
		{
			// 用户档案
			auth.GET("/user/profile", handlers.GetProfile)
			auth.PUT("/user/profile", handlers.UpdateProfile)

			// 账单
			auth.POST("/bills", handlers.CreateBill)
			auth.GET("/bills", handlers.ListBills)
			auth.GET("/bills/:id", handlers.GetBill)
			auth.PUT("/bills/:id", handlers.UpdateBill)
			auth.DELETE("/bills/:id", handlers.DeleteBill)

			// 活动
			auth.POST("/activities", handlers.CreateActivity)
			auth.GET("/activities", handlers.ListActivities)

			// 统计
			auth.GET("/stats/summary", handlers.GetSummary)
		}
	}

	// 启动
	addr := fmt.Sprintf(":%s", config.AppConfig.Port)
	log.Printf("羽球集 API 服务启动于 %s", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("启动失败: %v", err)
	}
}

// corsMiddleware 跨域中间件
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

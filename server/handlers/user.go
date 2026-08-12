package handlers

import (
	"fmt"
	"net/http"

	"yuqiuji-server/config"
	"yuqiuji-server/models"

	"github.com/gin-gonic/gin"
)

// GetProfile 获取用户档案
func GetProfile(c *gin.Context) {
	openid := c.GetString("openid")

	var user models.User
	if err := config.DB.Where("open_id = ?", openid).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 0, "data": models.User{}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": user})
}

// UpdateProfile 更新用户档案（仅更新请求中实际包含的字段，不擦除其他分区数据）
func UpdateProfile(c *gin.Context) {
	openid := c.GetString("openid")

	// 用 raw map 接收请求体，只更新实际传入的字段
	// 避免旧实现 ShouldBindJSON 绑定到完整 User 结构体后
	// 未传字段变成零值(空字符串)被 Updates 全量写入 DB 的问题
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	// JSON 字段名 → DB 列名映射
	fieldMap := map[string]string{
		"nickName":       "nick_name",
		"bio":            "bio",
		"avatarUrl":      "avatar_url",
		"skillLevel":     "skill_level",
		"playYears":      "play_years",
		"playFrequency":  "play_frequency",
		"playStyle":      "play_style",
		"mainRacket":     "main_racket",
		"shoes":          "shoes",
		"shuttleBrand":   "shuttle_brand",
		"stringTension":  "string_tension",
		"preferredVenue": "preferred_venue",
		"city":           "city",
		"playType":       "play_type",
		"hand":           "hand",
	}

	updates := map[string]interface{}{}
	for jsonKey, dbCol := range fieldMap {
		if val, exists := input[jsonKey]; exists {
			// stringTension 后端是 int，JSON 数字解码为 float64，需转换
			if jsonKey == "stringTension" {
				if f, ok := val.(float64); ok {
					updates[dbCol] = int(f)
				} else if s, ok := val.(string); ok {
					n := 0
					fmt.Sscanf(s, "%d", &n)
					updates[dbCol] = n
				} else {
					updates[dbCol] = val
				}
			} else {
				updates[dbCol] = val
			}
		}
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "无更新字段"})
		return
	}

	var user models.User
	result := config.DB.Where("open_id = ?", openid).First(&user)

	if result.Error != nil {
		// 新建用户
		user.OpenID = openid
		config.DB.Create(&user)
	}

	config.DB.Model(&user).Updates(updates)
	config.DB.Where("open_id = ?", openid).First(&user)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": user})
}

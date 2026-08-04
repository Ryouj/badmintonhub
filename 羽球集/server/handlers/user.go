package handlers

import (
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

// UpdateProfile 更新用户档案
func UpdateProfile(c *gin.Context) {
	openid := c.GetString("openid")

	var profile models.User
	if err := c.ShouldBindJSON(&profile); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	var user models.User
	result := config.DB.Where("open_id = ?", openid).First(&user)

	if result.Error != nil {
		// 新建
		profile.OpenID = openid
		config.DB.Create(&profile)
		c.JSON(http.StatusOK, gin.H{"code": 0, "data": profile})
		return
	}

	// 更新
	config.DB.Model(&user).Updates(map[string]interface{}{
		"nick_name":        profile.NickName,
		"bio":              profile.Bio,
		"avatar_url":       profile.AvatarURL,
		"skill_level":      profile.SkillLevel,
		"play_years":       profile.PlayYears,
		"play_frequency":   profile.PlayFrequency,
		"play_style":       profile.PlayStyle,
		"main_racket":      profile.MainRacket,
		"shoes":            profile.Shoes,
		"shuttle_brand":    profile.ShuttleBrand,
		"string_tension":   profile.StringTension,
		"preferred_venue":  profile.PreferredVenue,
		"city":             profile.City,
		"play_type":        profile.PlayType,
		"hand":             profile.Hand,
	})

	config.DB.Where("open_id = ?", openid).First(&user)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": user})
}

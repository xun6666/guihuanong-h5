@echo off
chcp 65001 >nul
echo ====================================
echo 正在上传项目到 GitHub...
echo ====================================
echo.

echo [1/6] 初始化 Git 仓库...
git init

echo.
echo [2/6] 添加所有文件...
git add .

echo.
echo [3/6] 创建首次提交...
git commit -m "first commit: 茶颜悦色桂花弄H5推广页面"

echo.
echo [4/6] 设置主分支为 main...
git branch -M main

echo.
echo [5/6] 添加远程仓库...
git remote add origin https://github.com/xun6666/guihuanong-h5.git

echo.
echo [6/6] 推送到 GitHub...
git push -u origin main

echo.
echo ====================================
echo ✅ 上传完成！
echo ====================================
echo.
echo 访问地址：https://github.com/xun6666/guihuanong-h5
echo.
echo 现在请到 GitHub 仓库设置中启用 GitHub Pages：
echo 1. 进入仓库 Settings
echo 2. 点击左侧 Pages
echo 3. Source 选择 main 分支
echo 4. 点击 Save
echo 5. 等待1-2分钟后访问：
echo    https://xun6666.github.io/guihuanong-h5/
echo.
pause


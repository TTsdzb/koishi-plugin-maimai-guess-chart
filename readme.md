# koishi-plugin-maimai-guess-chart

[![npm](https://img.shields.io/npm/v/koishi-plugin-maimai-guess-chart?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-maimai-guess-chart)

适用于 Koishi 的舞萌听 key 音猜谱面插件。

## 前置条件

1. 安装 ffmpeg 和 ffprobe，并将其路径添加到 `PATH` 环境变量中
2. 下载音频资源并解压，得到一个包含许多子文件夹的文件夹

## 使用方法

1. 在 Koishi 中安装该插件
2. 将 `audioPath` 设为解压音频资源得到的文件夹路径
3. 保存配置，启用插件

## 自定义资源

插件完全从资源读取歌曲，因此可以通过修改资源的方式自定义歌曲。以下是资源文件夹的结构示例：

```
audioPath
├── 10070_シンクルヘル_DX
│   ├── 1.mp3
│   ├── 2.mp3
│   ├── 3.mp3
│   └── 4.mp3
├── 100_TELLYOURWORLD
│   ├── 1.mp3
│   ├── 2.mp3
│   ├── 3.mp3
│   ├── 4.mp3
│   └── 5.mp3
├── ...
```

`audioPath` 路径下的每个子文件夹代表一首歌曲。其中文件夹名的前半部分为一整数，表示歌曲 ID，后半部分为歌曲标题。ID 与标题由且仅由文件名中的第一个 `_` 字符分割。

每首歌曲包含以数字 1~5 命名的 mp3 文件，分别为歌曲的绿、黄、红、紫、白谱的完整 key 音。若没有白谱，可以忽略。

插件只会在加载时扫描一遍歌曲，因此修改后请务必重载插件。为了避免找不到文件等问题，如果需要移除歌曲，请尽量先禁用插件或提前通知用户（群友）再操作。


#!/bin/zsh

mkdir -p icons

icons=(
  "fill/dashboard/v2"
  "fill/pause/v9"
  "fill/play/v4"
  "fill/spark/v12"
  "outline/alert_bubble/v3"
  "outline/arrow_up_right/v3"
  "outline/audio_square_stack/v2"
  "outline/bell/v12"
  "outline/chart_bar_square/v4"
  "outline/closed_captions/v4"
  "outline/dollar_sign_circle/v12"
  "outline/gear/v10"
  "outline/help_circle/v2"
  "outline/live/v3"
  "outline/magic_wand/v3"
  "outline/person3/v3"
  "outline/play_square_stack/v1"
  "outline/search/v16"
  "outline/square_pencil/v3"
  "outline/subtitles/v5"
  "outline/upload/v5"
  "outline/video_camera_add/v2"
)

for entry in "${icons[@]}"; do
  style="${entry%%/*}"
  rest="${entry#*/}"
  name="${rest%%/*}"
  version="${rest##*/}"

  url="https://fonts.gstatic.com/s/i/youtube_${style}_experimental/${name}/${version}/24px.svg"
  dest="icons/${style}-${name}.svg"

  echo "Downloading ${dest}"

  curl -fLsS --retry 2 "$url" -o "$dest" || {
    echo "FAILED: ${url}" >&2
    rm -f "$dest"
  }
done

echo "Downloaded SVGs:"
find icons -name '*.svg' -type f | sort


#!/bin/zsh

mkdir -p icons

icons=(
  "fill/closed_captions/v4"
  "fill/dashboard/v2"
  "fill/pause/v9"
  "fill/play/v4"
  "fill/spark/v12"
  "outline/alert_bubble/v3"
  "outline/arrow_in/v8"
  "outline/arrow_up_right/v3"
  "outline/audio_square_stack/v2"
  "outline/bell/v12"
  "outline/chart_bar_square/v4"
  "outline/circle_slash/v5"
  "outline/closed_captions/v4"
  "outline/dollar_sign_circle/v12"
  "outline/gear/v10"
  "outline/globe/v5"
  "outline/help_circle/v2"
  "outline/keyboard/v4"
  "outline/live/v3"
  "outline/magic_wand/v3"
  "outline/person3/v3"
  "outline/person_child/v2"
  "outline/person_gear/v2"
  "outline/person_shield/v8"
  "outline/person_square_stack/v2"
  "outline/play_circle_half_dashed/v1"
  "outline/play_square_stack/v1"
  "outline/search/v16"
  "outline/square_pencil/v3"
  "outline/subtitles/v5"
  "outline/text_align_left/v2"
  "outline/theme/v2"
  "outline/translate/v4"
  "outline/upload/v5"
  "outline/video_camera_add/v2"
  "outline/x_circle/v9"
  "outline/youtube_studio/v8"
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

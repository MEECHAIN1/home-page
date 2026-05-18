logs_pm2() {
  if ! has_cmd pm2; then
    err "PM2 not installed"
    exit 1
  fi

  if [ "${FOLLOW:-0}" = "1" ]; then
    pm2 logs "$APP_NAME"
  else
    pm2 logs "$APP_NAME" --lines 100 --nostream
  fi
}
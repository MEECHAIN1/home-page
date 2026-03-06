{ pkgs }: {
  deps = [
    pkgs.glibcLocales
    pkgs.tk
    pkgs.tcl
    pkgs.qhull
    pkgs.pkg-config
    pkgs.gtk3
    pkgs.gobject-introspection
    pkgs.ghostscript
    pkgs.freetype
    pkgs.ffmpeg-full
    pkgs.cairo
    pkgs.zlib
    pkgs.which
    pkgs.snappy
    pkgs.openssl
    pkgs.nsync
    pkgs.libjpeg_turbo
    pkgs.jsoncpp
    pkgs.grpc
    pkgs.gitFull
    pkgs.giflib
    pkgs.double-conversion
    pkgs.curl
    pkgs.bazel
  ];
}
import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:screen_brightness/screen_brightness.dart';
import 'package:volume_controller/volume_controller.dart';
import '../utils/constants.dart';

// ─── Main VideoCard (LiquidPlayer-style) ─────────────────────────────────────

class VideoCard extends StatefulWidget {
  final String? videoUrl;
  final String? title;
  final String? thumbnail;
  final List<Map<String, String>> qualities;
  final int selectedQualityIndex;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;
  final void Function(int)? onQualityChanged;
  final bool hasPrev;
  final bool hasNext;
  final bool isFullscreen;
  final VoidCallback? onFullscreen;

  const VideoCard({
    super.key,
    this.videoUrl,
    this.title,
    this.thumbnail,
    this.qualities = const [],
    this.selectedQualityIndex = 0,
    this.onPrev,
    this.onNext,
    this.onQualityChanged,
    this.hasPrev = false,
    this.hasNext = false,
    this.isFullscreen = false,
    this.onFullscreen,
  });

  @override
  State<VideoCard> createState() => VideoCardState();
}

class VideoCardState extends State<VideoCard>
    with SingleTickerProviderStateMixin {
  VideoPlayerController? _ctrl;
  bool _isInitialized = false;
  bool _hasError = false;

  // Controls visibility
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  Timer? _hideTimer;

  // Seek ripples
  bool _showLeftRipple = false;
  bool _showRightRipple = false;

  // Gestures (brightness/volume)
  double _brightness = 0.5;
  double _volume = 0.5;
  bool _showGestureUI = false;
  String _gestureType = '';
  double _gestureValue = 0.0;
  Timer? _gestureHideTimer;
  double _gestureAccumDelta = 0.0;
  bool _gestureActive = false;

  // Lock
  bool _locked = false;
  bool _showUnlockBtn = false;
  Timer? _unlockBtnTimer;
  bool _showQualityPanel = false;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 50),
      value: 1.0,
    );
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeInOut);
    _autoHide();
    _initGestures();
    if (widget.videoUrl != null && widget.videoUrl!.isNotEmpty) {
      _initPlayer(widget.videoUrl!);
    }
  }

  Future<void> _initGestures() async {
    try { _brightness = await ScreenBrightness().application; } catch (_) {}
    try { _volume = await VolumeController.instance.getVolume(); } catch (_) {}
  }

  @override
  void didUpdateWidget(VideoCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl && widget.videoUrl != null) {
      _initPlayer(widget.videoUrl!);
    }
    if (!widget.isFullscreen && _showQualityPanel) {
      _showQualityPanel = false;
    }
  }

  Future<void> _initPlayer(String url) async {
    if (url.isEmpty) return;
    setState(() { _isInitialized = false; _hasError = false; });
    await _ctrl?.dispose();
    final c = VideoPlayerController.networkUrl(
      Uri.parse(url),
      formatHint: url.contains('.m3u8') ? VideoFormat.hls : null,
      viewType: VideoViewType.platformView,
      videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
    );
    _ctrl = c;
    try {
      await c.initialize();
      if (!mounted) return;
      setState(() => _isInitialized = true);
      c.play();
      c.addListener(_onCtrlUpdate);
      _autoHide();
    } catch (_) {
      if (mounted) setState(() => _hasError = true);
    }
  }

  void _onCtrlUpdate() {
    if (!mounted) return;
    if (_ctrl!.value.isPlaying) {
      WakelockPlus.enable();
    } else {
      WakelockPlus.disable();
    }
  }

  void resetPlayer() {
    if (_ctrl != null && _isInitialized) {
      _ctrl!.pause();
      _ctrl!.seekTo(Duration.zero);
      WakelockPlus.disable();
    }
  }

  @override
  void dispose() {
    _ctrl?.removeListener(_onCtrlUpdate);
    _ctrl?.dispose();
    _fadeCtrl.dispose();
    _hideTimer?.cancel();
    _gestureHideTimer?.cancel();
    _unlockBtnTimer?.cancel();
    WakelockPlus.disable();
    super.dispose();
  }

  // ─── Controls visibility ──────────────────────────────────────────────────

  void _autoHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        _fadeCtrl.reverse();
      }
    });
  }

  void _showControls() {
    if (_locked) return;
    _fadeCtrl.forward();
    _autoHide();
  }

  void _toggleControls() {
    if (_locked) return;
    if (_fadeCtrl.isCompleted) {
      _fadeCtrl.reverse();
      _hideTimer?.cancel();
    } else {
      _showControls();
    }
  }

  // ─── Playback ─────────────────────────────────────────────────────────────

  void _togglePlay() {
    if (_ctrl == null || !_isInitialized) return;
    _ctrl!.value.isPlaying ? _ctrl!.pause() : _ctrl!.play();
    _showControls();
    setState(() {});
  }

  Future<void> _seekForward() async {
    if (_ctrl == null) return;
    await _ctrl!.seekTo(_ctrl!.value.position + const Duration(seconds: 5));
    if (_ctrl!.value.isPlaying) _ctrl!.play();
    setState(() => _showRightRipple = true);
    Future.delayed(const Duration(milliseconds: 550), () {
      if (mounted) setState(() => _showRightRipple = false);
    });
    _showControls();
    HapticFeedback.lightImpact();
  }

  Future<void> _seekBackward() async {
    if (_ctrl == null) return;
    final pos = _ctrl!.value.position - const Duration(seconds: 5);
    await _ctrl!.seekTo(pos < Duration.zero ? Duration.zero : pos);
    if (_ctrl!.value.isPlaying) _ctrl!.play();
    setState(() => _showLeftRipple = true);
    Future.delayed(const Duration(milliseconds: 550), () {
      if (mounted) setState(() => _showLeftRipple = false);
    });
    _showControls();
    HapticFeedback.lightImpact();
  }

  void _toggleSpeed() {
    if (_ctrl == null) return;
    final cur = _ctrl!.value.playbackSpeed;
    final next = cur == 1.0 ? 1.25 : cur == 1.25 ? 1.5 : cur == 1.5 ? 2.0 : 1.0;
    _ctrl!.setPlaybackSpeed(next);
    _showControls();
    setState(() {});
  }

  // ─── Lock ─────────────────────────────────────────────────────────────────

  void _toggleLock() {
    setState(() {
      _locked = !_locked;
      if (_locked) _showQualityPanel = false;
    });
    if (_locked) {
      _hideTimer?.cancel();
      _fadeCtrl.reverse();
      _showUnlockBtn = true;
      _unlockBtnTimer?.cancel();
      _unlockBtnTimer = Timer(const Duration(seconds: 3), () {
        if (mounted) setState(() => _showUnlockBtn = false);
      });
    } else {
      _unlockBtnTimer?.cancel();
      _showControls();
    }
  }

  void _toggleUnlockButton() {
    _unlockBtnTimer?.cancel();
    setState(() => _showUnlockBtn = !_showUnlockBtn);
    if (_showUnlockBtn) {
      _unlockBtnTimer = Timer(const Duration(seconds: 3), () {
        if (mounted) setState(() => _showUnlockBtn = false);
      });
    }
  }

  // ─── Gestures (brightness / volume) ──────────────────────────────────────

  void _onVerticalDragUpdate(DragUpdateDetails d, bool isLeft) {
    if (!widget.isFullscreen) return;
    final delta = d.primaryDelta ?? 0;
    _gestureAccumDelta += delta;
    if (!_gestureActive) {
      if (_gestureAccumDelta.abs() < 20) return;
      _gestureActive = true;
    }
    final change = -delta / 500;
    _gestureHideTimer?.cancel();
    if (_fadeCtrl.isCompleted) { _hideTimer?.cancel(); _fadeCtrl.reverse(); }
    setState(() {
      _showGestureUI = true;
      _gestureType = isLeft ? 'brightness' : 'volume';
      if (isLeft) {
        _brightness = (_brightness + change).clamp(0.0, 1.0);
        _gestureValue = _brightness;
        ScreenBrightness().setApplicationScreenBrightness(_brightness).catchError((_) {});
      } else {
        _volume = (_volume + change).clamp(0.0, 1.0);
        _gestureValue = _volume;
        VolumeController.instance.setVolume(_volume).catchError((_) {});
      }
    });
  }

  void _onVerticalDragEnd() {
    _gestureAccumDelta = 0.0;
    _gestureActive = false;
    _gestureHideTimer = Timer(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _showGestureUI = false);
    });
  }

  // ─── Quality picker ───────────────────────────────────────────────────────

  void _openQualityPicker() {
    if (widget.isFullscreen) {
      setState(() => _showQualityPanel = !_showQualityPanel);
      if (_showQualityPanel) {
        _hideTimer?.cancel();
      } else {
        _autoHide();
      }
      return;
    }
    _showQualitySheet();
  }

  void _selectQuality(int i) {
    widget.onQualityChanged?.call(i);
    setState(() => _showQualityPanel = false);
    _autoHide();
  }

  void _showQualitySheet() {
    _hideTimer?.cancel();
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0D0D12),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 8),
          Container(width: 36, height: 4,
              decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 14),
          const Text('Pilih Kualitas',
              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...List.generate(widget.qualities.length, (i) {
            final q = widget.qualities[i];
            final sel = i == widget.selectedQualityIndex;
            return ListTile(
              leading: Icon(sel ? Icons.radio_button_checked : Icons.radio_button_off,
                  color: sel ? const Color(AppConstants.primaryColor) : Colors.white38, size: 20),
              title: Text(q['label'] ?? 'Auto',
                  style: TextStyle(
                    color: sel ? const Color(AppConstants.primaryColor) : Colors.white,
                    fontWeight: sel ? FontWeight.w700 : FontWeight.normal,
                  )),
              onTap: () {
                widget.onQualityChanged?.call(i);
                Navigator.pop(context);
                _autoHide();
              },
            );
          }),
          const SizedBox(height: 16),
        ],
      ),
    ).then((_) => _autoHide());
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  String _fmt(Duration d) {
    if (d == Duration.zero) return '00:00';
    final h = d.inHours;
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return h > 0 ? '$h:$m:$s' : '$m:$s';
  }

  Widget _buildQualityPanel() {
    const panelW = 280.0;
    return Align(
      alignment: Alignment.centerRight,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeInOut,
        width: _showQualityPanel ? panelW : 0,
        clipBehavior: Clip.hardEdge,
        decoration: BoxDecoration(
          color: const Color(0xFF0D0D12).withValues(alpha: 0.98),
          border: Border(
            left: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
        ),
        child: OverflowBox(
          minWidth: panelW,
          maxWidth: panelW,
          alignment: Alignment.centerLeft,
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
                  child: Row(
                    children: [
                      const Icon(Icons.hd_outlined, color: Colors.white, size: 18),
                      const SizedBox(width: 8),
                      const Text(
                        'Kualitas',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () {
                          setState(() => _showQualityPanel = false);
                          _autoHide();
                        },
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.all(8),
                        icon: const Icon(Icons.close_rounded,
                            color: Colors.white54, size: 18),
                      ),
                    ],
                  ),
                ),
                const Divider(color: Colors.white10, height: 1),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: List.generate(widget.qualities.length, (i) {
                      final sel = i == widget.selectedQualityIndex;
                      final label = widget.qualities[i]['label'] ?? 'Auto';
                      return GestureDetector(
                        onTap: () => _selectQuality(i),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: sel
                                ? const Color(AppConstants.primaryColor)
                                : Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: sel
                                  ? Colors.white.withValues(alpha: 0.24)
                                  : Colors.transparent,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (sel) ...[
                                const Icon(Icons.check_rounded,
                                    color: Color(AppConstants.primaryFgColor),
                                    size: 14),
                                const SizedBox(width: 4),
                              ],
                              Text(
                                label,
                                style: TextStyle(
                                  color: sel
                                      ? const Color(AppConstants.primaryFgColor)
                                      : Colors.white70,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video / thumbnail
          if (_isInitialized && _ctrl != null)
            ValueListenableBuilder<VideoPlayerValue>(
              valueListenable: _ctrl!,
              builder: (_, v, __) {
                var ar = v.aspectRatio;
                final size = v.size;
                if (!ar.isFinite || ar < 0.2 || ar > 4) {
                  ar = (size.width > 32 && size.height > 32)
                      ? size.width / size.height
                      : 16 / 9;
                }
                return ColoredBox(
                  color: Colors.black,
                  child: Center(
                    child: AspectRatio(
                      aspectRatio: ar,
                      child: VideoPlayer(_ctrl!),
                    ),
                  ),
                );
              },
            )
          else if (widget.thumbnail != null)
            Image.network(AppConstants.proxyImage(widget.thumbnail), fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(color: Colors.black))
          else
            Container(color: Colors.black),

          // Loading
          if (!_isInitialized && !_hasError)
            const Center(child: CircularProgressIndicator(
                color: Color(AppConstants.primaryColor), strokeWidth: 2.5)),

          // Error
          if (_hasError) _buildError(),

          // Gesture zones (only when not errored)
          if (!_hasError)
            Row(children: [
              Expanded(child: GestureDetector(
                onTap: _toggleControls,
                onDoubleTap: _seekBackward,
                onVerticalDragUpdate: (d) => _onVerticalDragUpdate(d, true),
                onVerticalDragEnd: (_) => _onVerticalDragEnd(),
                behavior: HitTestBehavior.opaque,
                child: const SizedBox.expand(),
              )),
              SizedBox(width: 100, height: double.infinity,
                child: GestureDetector(
                  onTap: _toggleControls,
                  onDoubleTap: _togglePlay,
                  behavior: HitTestBehavior.opaque,
                  child: const SizedBox.expand(),
                )),
              Expanded(child: GestureDetector(
                onTap: _toggleControls,
                onDoubleTap: _seekForward,
                onVerticalDragUpdate: (d) => _onVerticalDragUpdate(d, false),
                onVerticalDragEnd: (_) => _onVerticalDragEnd(),
                behavior: HitTestBehavior.opaque,
                child: const SizedBox.expand(),
              )),
            ]),

          // Seek ripples
          if (_showLeftRipple) _buildRipple(isLeft: true),
          if (_showRightRipple) _buildRipple(isLeft: false),

          // Gesture indicator (brightness / volume)
          if (_showGestureUI)
            Positioned(
              left: _gestureType == 'brightness' ? 24 : null,
              right: _gestureType == 'volume' ? 24 : null,
              top: 0, bottom: 0,
              child: Center(child: _buildGestureIndicator()),
            ),

          // Controls overlay
          if (!_hasError)
            AnimatedBuilder(
              animation: _fadeCtrl,
              builder: (_, child) => FadeTransition(
                opacity: _fadeAnim,
                child: IgnorePointer(ignoring: _fadeCtrl.value < 0.1, child: child!),
              ),
              child: _buildOverlay(),
            ),

          // Thin progress bar when controls hidden
          if (!_hasError)
            Positioned(bottom: 0, left: 0, right: 0,
              child: AnimatedBuilder(
                animation: _fadeCtrl,
                builder: (_, __) {
                  final opacity = (1.0 - _fadeCtrl.value).clamp(0.0, 1.0);
                  if (opacity == 0.0) return const SizedBox.shrink();
                  return Opacity(
                    opacity: opacity,
                    child: _ctrl != null
                        ? ValueListenableBuilder(
                            valueListenable: _ctrl!,
                            builder: (_, v, __) {
                              final p = v.duration.inMilliseconds > 0
                                  ? v.position.inMilliseconds / v.duration.inMilliseconds
                                  : 0.0;
                              return _ThinProgressBar(progress: p.clamp(0.0, 1.0));
                            })
                        : const SizedBox.shrink(),
                  );
                },
              )),

          // Lock overlay (fullscreen)
          if (widget.isFullscreen && _locked)
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: _toggleUnlockButton,
                child: Stack(children: [
                  if (_showUnlockBtn) ...[
                    Center(
                      child: GestureDetector(
                        onTap: _toggleLock,
                        child: Container(
                          width: 72, height: 72,
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(AppConstants.primaryColor).withValues(alpha: 0.6),
                              width: 2,
                            ),
                          ),
                          child: const Icon(Icons.lock_open_rounded,
                              color: Color(AppConstants.primaryColor), size: 32),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 24, bottom: 24,
                      child: GestureDetector(
                        onTap: _toggleLock,
                        child: Container(
                          height: 44,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(AppConstants.primaryColor).withValues(alpha: 0.5),
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.lock_rounded, color: Color(AppConstants.primaryColor), size: 16),
                              SizedBox(width: 8),
                              Text('Buka Kunci', style: TextStyle(
                                  color: Color(AppConstants.primaryColor),
                                  fontSize: 13, fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ]),
              ),
            ),

          // Quality panel — fullscreen sidebar (miruapp-style)
          if (widget.isFullscreen) _buildQualityPanel(),
        ],
      ),
    );
  }

  Widget _buildOverlay() {
    if (_ctrl == null) return const SizedBox.shrink();
    return ValueListenableBuilder<VideoPlayerValue>(
      valueListenable: _ctrl!,
      builder: (context, value, _) {
        final pos = value.position;
        final dur = value.duration;
        final progress = dur.inMilliseconds > 0
            ? pos.inMilliseconds / dur.inMilliseconds
            : 0.0;

        return Stack(fit: StackFit.expand, children: [
          // Gradient scrim
          IgnorePointer(child: DecoratedBox(decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.35),
                Colors.transparent,
                Colors.transparent,
                Colors.black.withValues(alpha: 0.8),
              ],
              stops: const [0, 0.3, 0.55, 1],
            ),
          ))),

          // Title — fullscreen only, compact pill (hugs text)
          if (widget.isFullscreen && widget.title != null)
            Positioned(
              top: 12,
              left: 70,
              right: 70,
              child: Align(
                alignment: Alignment.topCenter,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: Text(
                        widget.title!,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // Play/Pause center
          Center(
            child: GestureDetector(
              onTap: _togglePlay,
              child: Container(
                width: widget.isFullscreen ? 72 : 54,
                height: widget.isFullscreen ? 72 : 54,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                ),
                child: value.isBuffering
                    ? Padding(
                        padding: EdgeInsets.all(widget.isFullscreen ? 20 : 14),
                        child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: widget.isFullscreen ? 3 : 2.5))
                    : Padding(
                        padding: EdgeInsets.only(left: value.isPlaying ? 0 : (widget.isFullscreen ? 4 : 3)),
                        child: Icon(
                          value.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                          color: Colors.white,
                          size: widget.isFullscreen ? 44 : 28,
                        )),
              ),
            ),
          ),

          // Bottom controls
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                widget.isFullscreen ? 32 : 12, 0,
                widget.isFullscreen ? 32 : 12,
                widget.isFullscreen ? 24 : 10),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                // Time
                Row(children: [
                  Text(
                    '${_fmt(pos)} / ${_fmt(dur)}',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: widget.isFullscreen ? 14 : 12,
                        fontWeight: FontWeight.w500),
                  ),
                ]),
                const SizedBox(height: 6),

                // Progress bar
                _VideoProgressBar(
                  progress: progress.clamp(0.0, 1.0),
                  buffered: value.buffered,
                  duration: dur,
                  onSeek: (v) {
                    _ctrl!.seekTo(Duration(milliseconds: (v * dur.inMilliseconds).round()));
                    _showControls();
                  },
                ),
                const SizedBox(height: 4),

                // Button row
                Row(children: [
                  _Btn(Icons.skip_previous_rounded,
                      onTap: widget.onPrev, enabled: widget.hasPrev,
                      isFullscreen: widget.isFullscreen),
                  SizedBox(width: widget.isFullscreen ? 8 : 4),
                  _Btn(
                    value.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    onTap: _togglePlay, isFullscreen: widget.isFullscreen),
                  SizedBox(width: widget.isFullscreen ? 8 : 4),
                  _Btn(Icons.skip_next_rounded,
                      onTap: widget.onNext, enabled: widget.hasNext,
                      isFullscreen: widget.isFullscreen),
                  const Spacer(),
                  ..._trailingButtons(value),
                ]),
              ]),
            ),
          ),
        ]);
      },
    );
  }

  List<Widget> _trailingButtons(VideoPlayerValue value) {
    final gap = widget.isFullscreen ? 8.0 : 4.0;
    final buttons = <Widget>[
      if (widget.isFullscreen) ...[
        _Btn(_locked ? Icons.lock_rounded : Icons.lock_open_rounded,
            onTap: _toggleLock, isFullscreen: true),
        SizedBox(width: gap),
      ],
      if (widget.qualities.length > 1) ...[
        _Btn(Icons.hd_outlined,
            onTap: _openQualityPicker,
            label: widget.isFullscreen
                ? widget.qualities[widget.selectedQualityIndex
                    .clamp(0, widget.qualities.length - 1)]["label"]
                : null,
            isFullscreen: widget.isFullscreen),
        SizedBox(width: gap),
      ],
      _Btn(Icons.speed_rounded,
          onTap: _toggleSpeed,
          label: widget.isFullscreen && value.playbackSpeed != 1.0
              ? "${value.playbackSpeed.toString().replaceAll(".0", "")}x"
              : null,
          isFullscreen: widget.isFullscreen),
      SizedBox(width: gap),
      _Btn(
          widget.isFullscreen
              ? Icons.fullscreen_exit_rounded
              : Icons.fullscreen_rounded,
          onTap: widget.onFullscreen,
          isFullscreen: widget.isFullscreen),
    ];

    // Keep some spacing even when there's no quality button in non-fullscreen mode
    if (!widget.isFullscreen && widget.qualities.length <= 1) {
      // Replace the gap with a smaller spacer when there's no quality button
      buttons.removeAt(buttons.length - 2);
      buttons.insert(buttons.length - 1, const SizedBox(width: 8));
    }

    return buttons;
  }

  Widget _buildError() {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: Colors.white54, size: 48),
            const SizedBox(height: 16),
            Text('Error loading video', style: TextStyle(color: Colors.white70, fontSize: 16)),
          ],
        ),
      ),
    );
  }

  Widget _buildRipple({required bool isLeft}) {
    return Positioned(
      left: isLeft ? 0 : null, right: isLeft ? null : 0,
      top: 0, bottom: 0,
      width: MediaQuery.of(context).size.width * 0.42,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 1.0, end: 0.0),
        duration: const Duration(milliseconds: 550),
        builder: (_, v, __) => Opacity(
          opacity: v,
          child: Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: isLeft ? Alignment.centerRight : Alignment.centerLeft,
                radius: 1.2,
                colors: [Colors.white.withValues(alpha: 0.15), Colors.transparent],
              ),
            ),
            child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(isLeft ? Icons.replay_5_rounded : Icons.forward_5_rounded,
                  color: Colors.white.withValues(alpha: 0.9), size: 36),
              const SizedBox(height: 4),
              const Text('5s', style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12, fontWeight: FontWeight.w700)),
            ])),
          ),
        ),
      ),
    );
  }

  Widget _buildGestureIndicator() {
    final isBrightness = _gestureType == 'brightness';
    final icon = isBrightness
        ? (_gestureValue > 0.5 ? Icons.brightness_high_rounded : Icons.brightness_low_rounded)
        : (_gestureValue > 0.5 ? Icons.volume_up_rounded
            : (_gestureValue > 0 ? Icons.volume_down_rounded : Icons.volume_off_rounded));

    return Container(
      width: 36,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: Colors.white, size: 18),
        const SizedBox(height: 10),
        SizedBox(
          height: 100, width: 4,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: Stack(alignment: Alignment.bottomCenter, children: [
              Container(color: Colors.white.withValues(alpha: 0.2)),
              FractionallySizedBox(
                heightFactor: _gestureValue,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(AppConstants.primaryColor),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 8),
        Text('${(_gestureValue * 100).round()}%',
            style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

// ─── Button widget ────────────────────────────────────────────────────────────

class _Btn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool enabled;
  final String? label;
  final bool isFullscreen;

  const _Btn(this.icon, {this.onTap, this.enabled = true, this.label, required this.isFullscreen});

  @override
  Widget build(BuildContext context) {
    const h = 36.0;
    const iconSize = 18.0;

    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        height: h,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        constraints: const BoxConstraints(minWidth: h),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: enabled ? 0.55 : 0.3),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withValues(alpha: enabled ? 0.15 : 0.05)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: enabled ? Colors.white : Colors.white24, size: iconSize),
              if (label != null) ...[
                const SizedBox(width: 5),
                Text(label!, style: const TextStyle(color: Colors.white,
                    fontSize: 11.0, fontWeight: FontWeight.w700)),
              ],
            ]),
      ),
    );
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

class _VideoProgressBar extends StatefulWidget {
  final double progress;
  final List<DurationRange> buffered;
  final Duration duration;
  final ValueChanged<double> onSeek;

  const _VideoProgressBar({
    required this.progress,
    required this.buffered,
    required this.duration,
    required this.onSeek,
  });

  @override
  State<_VideoProgressBar> createState() => _VideoProgressBarState();
}

class _VideoProgressBarState extends State<_VideoProgressBar> {
  bool _dragging = false;
  double _dragValue = 0.0;

  double get _display => _dragging ? _dragValue : widget.progress;

  void _handleDrag(double localX, double width) {
    setState(() { _dragging = true; _dragValue = (localX / width).clamp(0.0, 1.0); });
  }

  void _handleDragEnd() {
    widget.onSeek(_dragValue);
    setState(() => _dragging = false);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onHorizontalDragStart: (d) {
        final box = context.findRenderObject() as RenderBox;
        _handleDrag(d.localPosition.dx, box.size.width);
      },
      onHorizontalDragUpdate: (d) {
        final box = context.findRenderObject() as RenderBox;
        _handleDrag(d.localPosition.dx, box.size.width);
      },
      onHorizontalDragEnd: (_) => _handleDragEnd(),
      onTapDown: (d) {
        final box = context.findRenderObject() as RenderBox;
        widget.onSeek((d.localPosition.dx / box.size.width).clamp(0.0, 1.0));
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: LayoutBuilder(builder: (_, c) {
          final w = c.maxWidth;
          final filled = w * _display;

          double bufferW = 0;
          if (widget.buffered.isNotEmpty && widget.duration.inMilliseconds > 0) {
            bufferW = (widget.buffered.last.end.inMilliseconds /
                    widget.duration.inMilliseconds).clamp(0.0, 1.0) * w;
          }

          return Stack(alignment: Alignment.centerLeft, children: [
            Container(width: w, height: _dragging ? 10 : 6,
                decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10))),
            if (bufferW > 0)
              Container(width: bufferW.clamp(0.0, w), height: _dragging ? 10 : 6,
                  decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(10))),
            Container(width: filled.clamp(0.0, w), height: _dragging ? 10 : 6,
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10))),
            if (_dragging)
              Positioned(
                left: (filled - 16).clamp(0.0, w - 32),
                child: Container(width: 28, height: 28,
                    decoration: const BoxDecoration(
                        color: Colors.white, shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black38, blurRadius: 8)])),
              ),
          ]);
        }),
      ),
    );
  }
}

// ─── Thin progress bar (controls hidden) ─────────────────────────────────────

class _ThinProgressBar extends StatelessWidget {
  final double progress;
  const _ThinProgressBar({required this.progress});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (_, c) {
      return Stack(children: [
        Container(width: c.maxWidth, height: 3, color: Colors.white.withValues(alpha: 0.2)),
        Container(width: c.maxWidth * progress, height: 3, color: Colors.white),
      ]);
    });
  }
}

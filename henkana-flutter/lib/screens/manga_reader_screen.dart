import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/manga_provider.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../utils/constants.dart';

class MangaReaderScreen extends StatefulWidget {
  final String url;
  final String? title;

  const MangaReaderScreen({super.key, required this.url, this.title});

  @override
  State<MangaReaderScreen> createState() => _MangaReaderScreenState();
}

class _MangaReaderScreenState extends State<MangaReaderScreen> {
  late final MangaReaderProvider _prov;
  bool _showBars = true;

  @override
  void initState() {
    super.initState();
    _prov = MangaReaderProvider();
    _prov.fetchPages(widget.url);
  }

  @override
  void dispose() {
    _prov.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _toggleBars() {
    setState(() => _showBars = !_showBars);
    if (_showBars) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    } else {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _prov,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: _showBars
            ? AppBar(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                title: Text(
                  widget.title ?? 'Baca',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 15),
                ),
              )
            : null,
        body: Consumer<MangaReaderProvider>(
          builder: (_, prov, __) {
            if (prov.isLoading) {
              return const Center(
                child: CircularProgressIndicator(
                  color: Color(AppConstants.primaryColor),
                  strokeWidth: 2,
                ),
              );
            }
            if (prov.hasError) {
              return AppErrorWidget(
                message: prov.errorMessage,
                onRetry: () => prov.retry(widget.url),
                icon: Icons.image_not_supported_outlined,
              );
            }
            if (prov.pages.isEmpty) {
              return const Center(
                child: Text(
                  'Tidak ada halaman',
                  style: TextStyle(color: Color(AppConstants.textMuted)),
                ),
              );
            }
            return GestureDetector(
              onTap: _toggleBars,
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: prov.pages.length,
                itemBuilder: (_, i) => _PageImage(
                  url: prov.pages[i],
                  index: i,
                  total: prov.pages.length,
                ),
              ),
            );
          },
        ),
        bottomNavigationBar: _showBars
            ? Consumer<MangaReaderProvider>(
                builder: (_, prov, __) => prov.pages.isEmpty
                    ? const SizedBox.shrink()
                    : Container(
                        color: Colors.black,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        child: Text(
                          '${prov.pages.length} halaman',
                          style: const TextStyle(
                              color: Color(AppConstants.textMuted),
                              fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                      ),
              )
            : null,
      ),
    );
  }
}

class _PageImage extends StatelessWidget {
  final String url;
  final int index;
  final int total;

  const _PageImage({
    required this.url,
    required this.index,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        Image.network(
          AppConstants.proxyImage(url),
          width: double.infinity,
          fit: BoxFit.fitWidth,
          loadingBuilder: (_, child, progress) => progress == null
              ? child
              : SizedBox(
                  height: MediaQuery.of(context).size.height * 0.6,
                  child: Center(
                    child: ShimmerBox(
                      width: MediaQuery.of(context).size.width,
                      height: MediaQuery.of(context).size.height * 0.6,
                      borderRadius: 0,
                    ),
                  ),
                ),
          errorBuilder: (_, __, ___) => Container(
            height: 200,
            color: const Color(AppConstants.cardColor),
            child: const Center(
              child: Icon(Icons.broken_image_outlined,
                  color: Color(AppConstants.textMuted), size: 48),
            ),
          ),
        ),
        Positioned(
          bottom: 8,
          right: 10,
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '${index + 1}/$total',
              style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 10,
                  fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ],
    );
  }
}

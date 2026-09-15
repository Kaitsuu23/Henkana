import 'package:flutter/foundation.dart';
import '../models/manga_item.dart';
import '../models/manga_detail_data.dart';
import '../services/api_service.dart';

enum LoadState { idle, loading, loaded, error }

// ─── Manga list provider (manga / manhwa) ─────────────────────────────────────

class MangaListProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final String endpoint; // 'manga' | 'manhwa'

  MangaListProvider({required this.endpoint});

  LoadState _state = LoadState.idle;
  List<MangaItem> _items = [];
  String _errorMessage = '';
  int _currentPage = 1;
  bool _hasMore = true;

  LoadState get state => _state;
  List<MangaItem> get items => _items;
  String get errorMessage => _errorMessage;
  int get currentPage => _currentPage;
  bool get hasMore => _hasMore;
  bool get isLoading => _state == LoadState.loading;
  bool get hasError => _state == LoadState.error;

  Future<void> fetch({bool refresh = false}) async {
    if (_state == LoadState.loading) return;

    if (refresh) {
      _currentPage = 1;
      _items = [];
      _hasMore = true;
    }

    if (!_hasMore && !refresh) return;

    _state = LoadState.loading;
    notifyListeners();

    try {
      final result = await _api.fetchMangaListRaw(endpoint, page: _currentPage);
      if (result.isEmpty) {
        _hasMore = false;
      } else {
        if (refresh) {
          _items = result;
        } else {
          _items = [..._items, ...result];
        }
        _currentPage++;
      }
      _state = LoadState.loaded;
      _errorMessage = '';
    } catch (e) {
      _state = LoadState.error;
      _errorMessage = _parseError(e);
    }

    notifyListeners();
  }

  Future<void> refresh() => fetch(refresh: true);
  Future<void> loadMore() => fetch();

  String _parseError(Object e) {
    if (e is Exception) return e.toString().replaceFirst('Exception: ', '');
    return e.toString();
  }
}

// ─── Manga detail provider ────────────────────────────────────────────────────

class MangaDetailProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  LoadState _state = LoadState.idle;
  MangaDetailData? _data;
  String _errorMessage = '';
  String? _lastUrl;

  LoadState get state => _state;
  MangaDetailData? get data => _data;
  String get errorMessage => _errorMessage;
  bool get isLoading => _state == LoadState.loading;
  bool get hasError => _state == LoadState.error;

  Future<void> fetchDetail(String url) async {
    if (_state == LoadState.loading) return;
    if (_lastUrl == url && _state == LoadState.loaded) return;

    _state = LoadState.loading;
    _data = null;
    _lastUrl = url;
    notifyListeners();

    try {
      _data = await _api.fetchMangaDetail(url);
      _state = LoadState.loaded;
      _errorMessage = '';
    } catch (e) {
      _state = LoadState.error;
      _errorMessage = _parseError(e);
    }

    notifyListeners();
  }

  Future<void> retry(String url) {
    _lastUrl = null;
    return fetchDetail(url);
  }

  String _parseError(Object e) {
    if (e is Exception) return e.toString().replaceFirst('Exception: ', '');
    return e.toString();
  }
}

// ─── Manga reader provider ────────────────────────────────────────────────────

class MangaReaderProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  LoadState _state = LoadState.idle;
  List<String> _pages = [];
  String _errorMessage = '';
  String? _lastUrl;

  LoadState get state => _state;
  List<String> get pages => _pages;
  String get errorMessage => _errorMessage;
  bool get isLoading => _state == LoadState.loading;
  bool get hasError => _state == LoadState.error;

  Future<void> fetchPages(String url) async {
    if (_state == LoadState.loading) return;
    if (_lastUrl == url && _state == LoadState.loaded) return;

    _state = LoadState.loading;
    _pages = [];
    _lastUrl = url;
    notifyListeners();

    try {
      _pages = await _api.fetchMangaRead(url);
      _state = LoadState.loaded;
      _errorMessage = '';
    } catch (e) {
      _state = LoadState.error;
      _errorMessage = _parseError(e);
    }

    notifyListeners();
  }

  Future<void> retry(String url) {
    _lastUrl = null;
    return fetchPages(url);
  }

  String _parseError(Object e) {
    if (e is Exception) return e.toString().replaceFirst('Exception: ', '');
    return e.toString();
  }
}

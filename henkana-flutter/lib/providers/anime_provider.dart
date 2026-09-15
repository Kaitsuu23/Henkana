import 'package:flutter/foundation.dart';
import '../models/anime_item.dart';
import '../models/detail_data.dart';
import '../models/watch_data.dart';
import '../services/api_service.dart';

enum LoadState { idle, loading, loaded, error }

// ─── Anime list provider (hentai / uncensored / jav / doujinshi) ──────────────

class AnimeListProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final String endpoint; // 'hentai' | 'uncensored' | 'jav' | 'doujinshi'

  AnimeListProvider({required this.endpoint});

  LoadState _state = LoadState.idle;
  List<AnimeItem> _items = [];
  String _errorMessage = '';
  int _currentPage = 1;
  bool _hasMore = true;

  LoadState get state => _state;
  List<AnimeItem> get items => _items;
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
      final json = await _api.fetchAnimeListRaw(endpoint, page: _currentPage);
      if (json.isEmpty) {
        _hasMore = false;
      } else {
        if (refresh) {
          _items = json;
        } else {
          _items = [..._items, ...json];
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

// ─── Detail provider ──────────────────────────────────────────────────────────

class DetailProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  LoadState _state = LoadState.idle;
  DetailData? _data;
  String _errorMessage = '';
  String? _lastUrl;

  LoadState get state => _state;
  DetailData? get data => _data;
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
      _data = await _api.fetchDetail(url);
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

// ─── Watch / Stream provider ──────────────────────────────────────────────────

class WatchProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  LoadState _state = LoadState.idle;
  WatchData? _data;
  String _errorMessage = '';
  String? _lastUrl;
  int _selectedQualityIndex = 0;

  LoadState get state => _state;
  WatchData? get data => _data;
  String get errorMessage => _errorMessage;
  bool get isLoading => _state == LoadState.loading;
  bool get hasError => _state == LoadState.error;
  int get selectedQualityIndex => _selectedQualityIndex;

  String? get currentStreamUrl {
    if (_data == null || _data!.streams.isEmpty) return null;
    final idx = _selectedQualityIndex.clamp(0, _data!.streams.length - 1);
    return _data!.streams[idx].hlsUrl;
  }

  Future<void> fetchWatch(String url) async {
    if (_state == LoadState.loading) return;
    if (_lastUrl == url && _state == LoadState.loaded) return;

    _state = LoadState.loading;
    _data = null;
    _lastUrl = url;
    _selectedQualityIndex = 0;
    notifyListeners();

    try {
      _data = await _api.fetchWatch(url);
      _state = LoadState.loaded;
      _errorMessage = '';
    } catch (e) {
      _state = LoadState.error;
      _errorMessage = _parseError(e);
    }

    notifyListeners();
  }

  void selectQuality(int index) {
    _selectedQualityIndex = index;
    notifyListeners();
  }

  Future<void> retry(String url) {
    _lastUrl = null;
    return fetchWatch(url);
  }

  String _parseError(Object e) {
    if (e is Exception) return e.toString().replaceFirst('Exception: ', '');
    return e.toString();
  }
}

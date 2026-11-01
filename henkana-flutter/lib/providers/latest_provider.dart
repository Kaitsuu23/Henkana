import 'package:flutter/foundation.dart';
import '../models/anime_item.dart';
import '../services/api_service.dart';
import 'anime_provider.dart'; // re-use LoadState

// ─── Latest (order=update) list provider ─────────────────────────────────────

class LatestProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

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
      final json = await _api.fetchDaftarSeries(
        page: _currentPage,
        order: 'update',
      );

      final newItems =
          (json['data'] as List?)
              ?.map((e) => AnimeItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];

      _hasMore = json['hasNextPage'] == true;

      if (refresh) {
        _items = newItems;
      } else {
        _items = [..._items, ...newItems];
      }

      if (newItems.isEmpty) _hasMore = false;

      _currentPage++;
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

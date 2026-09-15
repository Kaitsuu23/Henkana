import 'package:flutter/foundation.dart';
import '../models/home_section.dart';
import '../services/api_service.dart';

enum LoadState { idle, loading, loaded, error }

class HomeProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  LoadState _state = LoadState.idle;
  List<HomeSection> _sections = [];
  String _errorMessage = '';

  LoadState get state => _state;
  List<HomeSection> get sections => _sections;
  String get errorMessage => _errorMessage;
  bool get isLoading => _state == LoadState.loading;
  bool get hasError => _state == LoadState.error;

  Future<void> fetchHome({bool refresh = false}) async {
    if (_state == LoadState.loading) return;
    if (_state == LoadState.loaded && !refresh) return;

    _state = LoadState.loading;
    if (refresh) _sections = [];
    notifyListeners();

    try {
      _sections = await _api.fetchHome();
      _state = LoadState.loaded;
      _errorMessage = '';
    } catch (e) {
      _state = LoadState.error;
      _errorMessage = _parseError(e);
    }

    notifyListeners();
  }

  Future<void> refresh() => fetchHome(refresh: true);

  String _parseError(Object e) {
    if (e is Exception) return e.toString().replaceFirst('Exception: ', '');
    return e.toString();
  }
}

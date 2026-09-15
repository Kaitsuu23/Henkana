import 'package:shared_preferences/shared_preferences.dart';

/// Thin wrapper untuk shared_preferences.
/// Semua key di-define di sini supaya tidak ada typo.
class Prefs {
  static const _keyEpisodeReversed = 'episode_list_reversed';
  static const _keyChapterReversed = 'chapter_list_reversed';

  // ── Episode sort (anime detail) ──────────────────────────────────────────

  static Future<bool> getEpisodeReversed() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyEpisodeReversed) ?? false;
  }

  static Future<void> setEpisodeReversed(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyEpisodeReversed, value);
  }

  // ── Chapter sort (manga detail) ───────────────────────────────────────────

  static Future<bool> getChapterReversed() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyChapterReversed) ?? false;
  }

  static Future<void> setChapterReversed(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyChapterReversed, value);
  }
}

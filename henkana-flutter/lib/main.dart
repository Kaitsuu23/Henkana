import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/home_provider.dart';
import 'providers/search_provider.dart';
import 'utils/app_theme.dart';
import 'screens/main_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Force portrait-only on Android
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // Full-screen immersive dark system UI
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
      systemNavigationBarDividerColor: Colors.transparent,
    ),
  );

  runApp(const HenkanaApp());
}

class HenkanaApp extends StatelessWidget {
  const HenkanaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Home data
        ChangeNotifierProvider(create: (_) => HomeProvider()),

        // Search + genre (shared across tabs / search screen)
        ChangeNotifierProvider(create: (_) => SearchProvider()),
        ChangeNotifierProvider(create: (_) => GenreProvider(isManga: false)),
        ChangeNotifierProvider(
            create: (_) => GenreProvider(isManga: true)),
      ],
      child: MaterialApp(
        title: 'Henkana',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const MainScreen(),
        builder: (context, child) {
          // Clamp font scaling so layout doesn't break on large-font devices
          return MediaQuery(
            data: MediaQuery.of(context).copyWith(
              textScaler: TextScaler.linear(
                MediaQuery.of(context).textScaler.scale(1.0).clamp(0.8, 1.15),
              ),
            ),
            child: child!,
          );
        },
      ),
    );
  }
}

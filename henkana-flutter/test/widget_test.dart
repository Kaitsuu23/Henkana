import 'package:flutter_test/flutter_test.dart';
import 'package:henkana_flutter/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const HenkanaApp());
    expect(find.byType(HenkanaApp), findsOneWidget);
  });
}

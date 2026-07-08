import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/screens/support_screen.dart';

void main() {
  testWidgets('shows support chart card in support screen', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: SupportChartCard(),
        ),
      ),
    );

    expect(find.text('Support Chart'), findsOneWidget);
    expect(find.textContaining('Your support requests'), findsOneWidget);
  });
}

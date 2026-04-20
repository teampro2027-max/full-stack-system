import 'dart:typed_data';

abstract class DownloadHelper {
  static Future<void> downloadFile(Uint8List bytes, String fileName) async {
    throw UnimplementedError('Platform not supported');
  }
}

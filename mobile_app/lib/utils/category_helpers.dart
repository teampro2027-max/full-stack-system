import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/bill_provider.dart';

Widget getCategoryIcon(String iconName, {Color? color, double size = 20}) {
  // If the iconName looks like an emoji (non-ASCII or short with Unicode), display as text
  final isLikelyEmoji = iconName.runes.any((r) => r > 0x1F00) || iconName.length <= 2;
  if (isLikelyEmoji) {
    return Text(iconName, style: TextStyle(fontSize: size));
  }

  IconData iconData;
  String cleanName = iconName.trim().toLowerCase();
  
  if (cleanName.endsWith('icon') && cleanName.length > 4) {
    cleanName = cleanName.substring(0, cleanName.length - 4);
  }
  cleanName = cleanName.replaceAll('-', '').replaceAll('_', '');

  switch (cleanName) {
    case 'zap':
    case 'bolt':
    case 'flash':
    case 'energy':
    case 'power':
    case 'flame':
    case 'fire':
    case 'light':
    case 'electricity':
      iconData = Icons.bolt;
      break;
    case 'droplet':
    case 'water':
    case 'glasswater':
    case 'glass-water':
    case 'waves':
    case 'rain':
    case 'shower':
    case 'liquid':
      iconData = Icons.water_drop;
      break;
    case 'wifi':
    case 'internet':
    case 'globe':
    case 'network':
    case 'signal':
    case 'rss':
    case 'router':
    case 'antenna':
    case 'link':
      iconData = Icons.wifi;
      break;
    case 'home':
    case 'rent':
    case 'building':
    case 'warehouse':
    case 'store':
    case 'apartment':
    case 'office':
    case 'hotel':
    case 'house':
      iconData = Icons.home;
      break;
    case 'graduationcap':
    case 'graduation-cap':
    case 'school':
    case 'book':
    case 'books':
    case 'library':
    case 'bookopen':
    case 'book-open':
    case 'notebook':
    case 'pencil':
    case 'pen':
    case 'ruler':
      iconData = Icons.school;
      break;
    case 'phone':
    case 'smartphone':
    case 'phonecall':
    case 'phone-call':
      iconData = Icons.phone_android;
      break;
    case 'tv':
    case 'monitor':
    case 'screen':
      iconData = Icons.tv;
      break;
    case 'trash':
    case 'trash2':
    case 'trash-2':
    case 'delete':
    case 'bin':
    case 'recycle':
      iconData = Icons.delete;
      break;
    case 'dollarsign':
    case 'dollar':
    case 'dollar-sign':
    case 'coins':
    case 'coin':
    case 'creditcard':
    case 'credit-card':
    case 'wallet':
    case 'banknote':
    case 'bank':
    case 'piggybank':
    case 'piggy-bank':
    case 'vault':
    case 'receipt':
    case 'cash':
    case 'pay':
      iconData = Icons.attach_money;
      break;
    case 'filetext':
    case 'file':
    case 'clipboard':
    case 'file-text':
      iconData = Icons.description;
      break;
    case 'activity':
    case 'local_activity':
      iconData = Icons.local_activity;
      break;
    case 'shoppingcart':
    case 'shopping-cart':
    case 'cart':
    case 'bag':
    case 'shoppingbag':
    case 'shopping-bag':
    case 'package':
    case 'box':
      iconData = Icons.shopping_cart;
      break;
    case 'car':
    case 'truck':
    case 'bus':
    case 'bike':
    case 'bicycle':
    case 'motorcycle':
      iconData = Icons.directions_car;
      break;
    case 'lightbulb':
      iconData = Icons.lightbulb;
      break;
    case 'heart':
      iconData = Icons.favorite;
      break;
    case 'calendar':
      iconData = Icons.calendar_today;
      break;
    case 'clock':
    case 'time':
    case 'history':
    case 'timer':
    case 'alarm':
    case 'alarmclock':
    case 'alarm-clock':
      iconData = Icons.access_time;
      break;
    case 'user':
    case 'user_outline':
    case 'user-outline':
    case 'users':
    case 'person':
    case 'people':
    case 'avatar':
      iconData = Icons.person;
      break;
    case 'tag':
    case 'tags':
    case 'pricetag':
    case 'price-tag':
      iconData = Icons.local_offer;
      break;
    case 'bell':
    case 'bellring':
    case 'bell-ring':
    case 'notification':
      iconData = Icons.notifications;
      break;
    case 'settings':
    case 'sliders':
    case 'wrench':
    case 'cog':
    case 'gears':
    case 'gear':
      iconData = Icons.settings;
      break;
    case 'trendingup':
    case 'trending-up':
    case 'trendingdown':
    case 'trending-down':
    case 'barchart3':
    case 'bar-chart-3':
    case 'linechart':
    case 'line-chart':
    case 'piechart':
    case 'pie-chart':
      iconData = Icons.trending_up;
      break;
    case 'coffee':
    case 'cup':
    case 'mug':
    case 'utensils':
    case 'fork':
    case 'spoon':
    case 'plate':
    case 'pizza':
    case 'cake':
    case 'burger':
      iconData = Icons.local_cafe;
      break;
    case 'plane':
    case 'airplane':
    case 'flight':
      iconData = Icons.flight;
      break;
    case 'gift':
      iconData = Icons.card_giftcard;
      break;
    case 'sun':
      iconData = Icons.wb_sunny;
      break;
    case 'moon':
      iconData = Icons.brightness_3;
      break;
    case 'map':
    case 'mappin':
    case 'map-pin':
      iconData = Icons.map;
      break;
    case 'mail':
    case 'envelope':
      iconData = Icons.email;
      break;
    case 'music':
      iconData = Icons.music_note;
      break;
    case 'camera':
      iconData = Icons.camera_alt;
      break;
    case 'info':
    case 'infocircle':
    case 'info-circle':
      iconData = Icons.info;
      break;
    case 'help':
    case 'helpcircle':
    case 'help-circle':
      iconData = Icons.help;
      break;
    case 'warning':
    case 'alert':
    case 'alerttriangle':
    case 'alert-triangle':
      iconData = Icons.warning;
      break;
    default:
      iconData = Icons.receipt_long; // general fallback
  }

  return Icon(iconData, color: color, size: size);
}

Map<String, dynamic> getCategoryMeta(BuildContext context, String categoryKey, Map<String, Map<String, dynamic>> staticCategoryMeta) {
  // 1. Search in dynamic categories loaded by BillProvider first
  final categories = Provider.of<BillProvider>(context, listen: false).categories;
  final dynamicCat = categories.firstWhere(
    (c) => c['key'] == categoryKey || c['name'].toString().toLowerCase() == categoryKey.toLowerCase(),
    orElse: () => null,
  );

  if (dynamicCat != null) {
    // Determine color
    Color color = Colors.grey;
    final colorStr = dynamicCat['color'] as String?;
    if (colorStr != null) {
      if (colorStr.contains('indigo')) {
        color = const Color(0xFF4F46E5);
      } else if (colorStr.contains('blue')) {
        color = const Color(0xFF3B82F6);
      } else if (colorStr.contains('green')) {
        color = const Color(0xFF10B981);
      } else if (colorStr.contains('purple')) {
        color = const Color(0xFF8B5CF6);
      } else if (colorStr.contains('red')) {
        color = const Color(0xFFEF4444);
      } else if (colorStr.contains('pink')) {
        color = const Color(0xFFEC4899);
      } else if (colorStr.contains('yellow') || colorStr.contains('amber')) {
        color = const Color(0xFFF59E0B);
      } else if (colorStr.contains('orange')) {
        color = const Color(0xFFF97316);
      } else if (colorStr.contains('teal')) {
        color = const Color(0xFF14B8A6);
      } else if (colorStr.contains('lime')) {
        color = const Color(0xFF84CC16);
      }
    }

    return {
      'icon': dynamicCat['icon'] ?? '📋',
      'color': color,
      'name': dynamicCat['name'] ?? categoryKey,
    };
  }

  // 2. Check the hardcoded _categoryMeta
  final staticMeta = staticCategoryMeta[categoryKey];
  if (staticMeta != null) {
    return staticMeta;
  }

  // 3. Fallback
  return {
    'icon': '📋',
    'color': Colors.grey,
    'name': categoryKey,
  };
}

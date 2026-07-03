import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/bill_provider.dart';
import '../providers/language_provider.dart';
import '../utils/category_helpers.dart';

class AddBillScreen extends StatefulWidget {
  final Map<String, dynamic>? existingBill;
  const AddBillScreen({Key? key, this.existingBill}) : super(key: key);

  @override
  _AddBillScreenState createState() => _AddBillScreenState();
}

class _AddBillScreenState extends State<AddBillScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();

  String _category = '';
  String _selectedParentId = '';
  DateTime _startDate = DateTime.now();
  DateTime _dueDate = DateTime.now().add(const Duration(days: 7));
  DateTime? _notificationDate = DateTime.now().add(const Duration(days: 1));
  bool _setReminder = true;

  bool _isRecurring = false;
  String _recurringInterval = 'monthly';
  bool _loading = false;
  bool _voiceMode = false;
  final _voiceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.existingBill != null) {
      final b = widget.existingBill!;
      _titleController.text = b['title'] ?? '';
      _amountController.text = '${b['amount'] ?? ''}';
      _notesController.text = b['notes'] ?? '';
      _category = b['category'] ?? '';
      _isRecurring = b['isRecurring'] ?? false;
      _recurringInterval = b['recurringInterval'] ?? 'monthly';
      if (b['dueDate'] != null) {
        final parsed = DateTime.tryParse(b['dueDate']);
        if (parsed != null) _dueDate = parsed;
      }
      if (b['startDate'] != null) {
        final parsed = DateTime.tryParse(b['startDate']);
        if (parsed != null) _startDate = parsed;
      }
      if (b['notificationDate'] != null) {
        final parsed = DateTime.tryParse(b['notificationDate']);
        if (parsed != null) {
          _notificationDate = parsed;
          _setReminder = true;
        }
      }
    }
    // Ensure categories are loaded and find parentId if editing a subcategory
    Future.microtask(() {
      final provider = Provider.of<BillProvider>(context, listen: false);
      provider.fetchCategories().then((_) {
        if (mounted && _category.isNotEmpty) {
          final cat = provider.categories.firstWhere(
            (c) => c['key'] == _category,
            orElse: () => null,
          );
          if (cat != null && cat['parentId'] != null) {
            setState(() {
              _selectedParentId = cat['parentId'];
            });
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    _voiceController.dispose();
    super.dispose();
  }

  Future<DateTime?> _pickDateTime(DateTime initialDateTime) async {
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDateTime,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: Color(0xFF4F46E5)),
        ),
        child: child!,
      ),
    );
    if (pickedDate == null) return null;

    final pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initialDateTime),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: Color(0xFF4F46E5)),
        ),
        child: child!,
      ),
    );
    if (pickedTime == null) return null;

    return DateTime(
      pickedDate.year,
      pickedDate.month,
      pickedDate.day,
      pickedTime.hour,
      pickedTime.minute,
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_category.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Fadlan dooro category ama subcategory')),
      );
      return;
    }

    final now = DateTime.now();
    final buffer = const Duration(minutes: 5);

    if (_notificationDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a reminder date and time')),
      );
      return;
    }

    if (widget.existingBill == null) {
      if (_notificationDate!.isBefore(now.subtract(buffer))) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Reminder date and time cannot be in the past')),
        );
        return;
      }
    } else {
      final originalNotifStr = widget.existingBill!['notificationDate'];
      final originalNotif = originalNotifStr != null ? DateTime.tryParse(originalNotifStr) : null;
      if (originalNotif == null || _notificationDate!.isAtSameMomentAs(originalNotif) == false) {
        if (_notificationDate!.isBefore(now.subtract(buffer))) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Reminder date and time cannot be in the past')),
          );
          return;
        }
      }
    }

    setState(() => _loading = true);

    final resolvedStartDate = widget.existingBill != null
        ? (DateTime.tryParse(widget.existingBill!['startDate'] ?? '') ?? now)
        : now;

    final data = {
      'title': _titleController.text.trim(),
      'amount': double.parse(_amountController.text),
      'dueDate': _notificationDate!.toIso8601String(),
      'startDate': resolvedStartDate.toIso8601String(),
      'notificationDate': _notificationDate!.toIso8601String(),
      'category': _category,
      'isRecurring': _isRecurring,
      'recurringInterval': _recurringInterval,
      'notes': _notesController.text.trim(),
    };

    try {
      final billProvider = Provider.of<BillProvider>(context, listen: false);
      if (widget.existingBill != null) {
        await billProvider.updateBill(widget.existingBill!['_id'], data);
      } else {
        await billProvider.addBill(data);
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final isEditing = widget.existingBill != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? lang.t('editBill') : lang.t('addBill'),
            style: const TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: Icon(_voiceMode ? Icons.edit : Icons.mic,
                color: _voiceMode ? Colors.indigo : Colors.grey),
            onPressed: () => setState(() => _voiceMode = !_voiceMode),
            tooltip: 'Voice Entry',
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Voice mode banner
              if (_voiceMode) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF6366F1)]),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(children: [
                        Icon(Icons.mic, color: Colors.white, size: 20),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Voice Bill Entry',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ]),
                      const SizedBox(height: 8),
                      const Text('Type or paste your voice transcript and tap "Parse"', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _voiceController,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(
                          hintText: 'e.g. "electricity bill 120 dollars due October 15"',
                          hintStyle: TextStyle(color: Colors.white38),
                          filled: true, fillColor: Colors.white24,
                          border: OutlineInputBorder(borderSide: BorderSide.none, borderRadius: BorderRadius.all(Radius.circular(12))),
                        ),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () {
                          final text = _voiceController.text.toLowerCase();
                          // Simple parser
                          final amountMatch = RegExp(r'(\d+(\.\d{1,2})?)').firstMatch(text);
                          if (amountMatch != null) _amountController.text = amountMatch.group(1)!;
                          
                          final billProvider = Provider.of<BillProvider>(context, listen: false);
                          final categories = billProvider.categories;
                          
                          for (final cat in categories) {
                            if (text.contains(cat['name'].toString().toLowerCase())) { 
                              setState(() {
                                if (cat['parentId'] != null) {
                                  _selectedParentId = cat['parentId'];
                                  _category = cat['key'];
                                } else {
                                  _selectedParentId = '';
                                  _category = cat['key'];
                                }
                              }); 
                              break; 
                            }
                          }
                          if (_titleController.text.isEmpty && _category.isNotEmpty) {
                            final matchedCat = categories.firstWhere((c) => c['key'] == _category, orElse: () => {'name': 'Bill'});
                            _titleController.text = '${matchedCat['name']} (Voice)';
                          }
                          setState(() => _voiceMode = false);
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.indigo),
                        child: const Text('Parse & Fill Form'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              _label(lang.t('title')),
              TextFormField(
                controller: _titleController,
                decoration: _inputDec('e.g. Electricity Bill October'),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(v.trim())) {
                    return 'Title can only contain letters and spaces';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              _label(lang.t('category')),
              Consumer<BillProvider>(
                builder: (context, provider, child) {
                  final allCategories = provider.categories;
                  final parentCategories = allCategories.where((c) => c['parentId'] == null).toList();

                  if (parentCategories.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text('No categories available', style: TextStyle(color: Colors.grey)),
                    );
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Parent Categories Selector
                      SizedBox(
                        height: 52,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: parentCategories.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (ctx, i) {
                            final cat = parentCategories[i];
                            final isSelectedParent = _selectedParentId == cat['_id'] || (_selectedParentId.isEmpty && _category == cat['key']);
                            return GestureDetector(
                              onTap: () {
                                final subs = allCategories.where((c) => c['parentId'] == cat['_id']).toList();
                                if (subs.isNotEmpty) {
                                  setState(() {
                                    _selectedParentId = cat['_id'];
                                    _category = ''; // must select subcategory
                                  });
                                } else {
                                  setState(() {
                                    _selectedParentId = '';
                                    _category = cat['key'];
                                  });
                                }
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelectedParent ? const Color(0xFF4F46E5) : Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: isSelectedParent ? const Color(0xFF4F46E5) : Colors.grey.shade200),
                                  boxShadow: isSelectedParent ? [BoxShadow(color: const Color(0xFF4F46E5).withOpacity(0.25), blurRadius: 8, offset: const Offset(0, 4))] : [],
                                ),
                                child: Row(children: [
                                  cat['image'] != null && cat['image'].toString().isNotEmpty
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          child: Image.network(
                                            'https://full-stack-system-1ex6.onrender.com${cat['image']}',
                                            width: 16,
                                            height: 16,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => getCategoryIcon(
                                              cat['icon'] ?? '📋',
                                              color: isSelectedParent ? Colors.white : const Color(0xFF4F46E5),
                                              size: 16,
                                            ),
                                          ),
                                        )
                                      : getCategoryIcon(
                                          cat['icon'] ?? '📋',
                                          color: isSelectedParent ? Colors.white : const Color(0xFF4F46E5),
                                          size: 16,
                                        ),
                                  const SizedBox(width: 6),
                                  Text(cat['name'], style: TextStyle(color: isSelectedParent ? Colors.white : Colors.grey.shade700, fontSize: 12, fontWeight: FontWeight.w600)),
                                ]),
                              ),
                            );
                          },
                        ),
                      ),

                      // Subcategories Selector (if parent has subcategories)
                      if (_selectedParentId.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _label('Subcategory'),
                        SizedBox(
                          height: 48,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: allCategories.where((c) => c['parentId'] == _selectedParentId).length,
                            separatorBuilder: (_, __) => const SizedBox(width: 6),
                            itemBuilder: (ctx, i) {
                              final subs = allCategories.where((c) => c['parentId'] == _selectedParentId).toList();
                              final cat = subs[i];
                              final selected = _category == cat['key'];
                              return GestureDetector(
                                onTap: () => setState(() => _category = cat['key']),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: selected ? const Color(0xFF10B981) : Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: selected ? const Color(0xFF10B981) : Colors.grey.shade200),
                                    boxShadow: selected ? [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.2), blurRadius: 6, offset: const Offset(0, 3))] : [],
                                  ),
                                  child: Row(children: [
                                    cat['image'] != null && cat['image'].toString().isNotEmpty
                                        ? ClipRRect(
                                            borderRadius: BorderRadius.circular(4),
                                            child: Image.network(
                                              'https://full-stack-system-1ex6.onrender.com${cat['image']}',
                                              width: 14,
                                              height: 14,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => getCategoryIcon(
                                                cat['icon'] ?? '📋',
                                                color: selected ? Colors.white : const Color(0xFF10B981),
                                                size: 14,
                                              ),
                                            ),
                                          )
                                        : getCategoryIcon(
                                            cat['icon'] ?? '📋',
                                            color: selected ? Colors.white : const Color(0xFF10B981),
                                            size: 14,
                                          ),
                                    const SizedBox(width: 5),
                                    Text(cat['name'], style: TextStyle(color: selected ? Colors.white : Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.w600)),
                                  ]),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ],
                  );
                }
              ),
              const SizedBox(height: 16),

              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _label(lang.t('amount')),
                  TextFormField(
                    controller: _amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: _inputDec('\$ 0.00'),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required';
                      final val = double.tryParse(v);
                      if (val == null || val <= 0) {
                        return 'Enter a valid positive number';
                      }
                      return null;
                    },
                  ),
                ])),
              ]),
              const SizedBox(height: 16),

              // Dates: Start Date & Due Date Row has been hidden.
              // We only display the Reminder Date & Time selector directly.
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _label('Reminder Date & Time'),
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: () async {
                      final dt = await _pickDateTime(_notificationDate ?? DateTime.now().add(const Duration(days: 1)));
                      if (dt != null) setState(() => _notificationDate = dt);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.notifications_active, size: 14, color: Colors.indigo),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              _notificationDate == null
                                  ? 'Select Reminder Date & Time'
                                  : '${_notificationDate!.day}/${_notificationDate!.month}/${_notificationDate!.year} ${_notificationDate!.hour.toString().padLeft(2, '0')}:${_notificationDate!.minute.toString().padLeft(2, '0')}',
                              style: const TextStyle(fontSize: 12),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade100)),
                child: Column(children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text(lang.t('recurring'), style: const TextStyle(fontWeight: FontWeight.w600)),
                    Switch(value: _isRecurring, onChanged: (v) => setState(() => _isRecurring = v),
                        activeColor: const Color(0xFF4F46E5)),
                  ]),
                  if (_isRecurring) ...[
                    const Divider(height: 16),
                    Row(children: ['monthly', 'yearly'].map((opt) => Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _recurringInterval = opt),
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _recurringInterval == opt ? const Color(0xFF4F46E5) : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(lang.t(opt), textAlign: TextAlign.center,
                              style: TextStyle(color: _recurringInterval == opt ? Colors.white : Colors.grey.shade700,
                                  fontWeight: FontWeight.w600, fontSize: 13)),
                        ),
                      ),
                    )).toList()),
                  ]
                ]),
              ),
              const SizedBox(height: 16),

              _label('Notes (optional)'),
              TextFormField(
                controller: _notesController,
                decoration: _inputDec('Additional notes...'),
                maxLines: 2,
              ),
              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(isEditing ? lang.t('editBill') : lang.t('addBill'),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(text, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.grey.shade700)),
  );

  InputDecoration _inputDec(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
    filled: true, fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 2)),
  );
}

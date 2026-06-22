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
  DateTime _dueDate = DateTime.now().add(const Duration(days: 7));
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
        _dueDate = DateTime.tryParse(b['dueDate']) ?? _dueDate;
      }
    }
    // Ensure categories are loaded (in case screen was opened without visiting dashboard)
    Future.microtask(() {
      final provider = Provider.of<BillProvider>(context, listen: false);
      if (provider.categories.isEmpty) {
        provider.fetchCategories();
      }
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

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: Color(0xFF4F46E5)),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _dueDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    final data = {
      'title': _titleController.text.trim(),
      'amount': double.parse(_amountController.text),
      'dueDate': _dueDate.toIso8601String(),
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
                              setState(() => _category = cat['key']); 
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
                  final categories = provider.categories;
                  if (categories.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text('No categories available', style: TextStyle(color: Colors.grey)),
                    );
                  }
                  
                  if (_category.isEmpty && categories.isNotEmpty) {
                    // Set initial category if empty
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) setState(() => _category = categories[0]['key']);
                    });
                  }

                  return SizedBox(
                    height: 52,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (ctx, i) {
                        final cat = categories[i];
                        final selected = _category == cat['key'];
                        return GestureDetector(
                          onTap: () => setState(() => _category = cat['key']),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: selected ? const Color(0xFF4F46E5) : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: selected ? const Color(0xFF4F46E5) : Colors.grey.shade200),
                              boxShadow: selected ? [BoxShadow(color: const Color(0xFF4F46E5).withOpacity(0.25), blurRadius: 8, offset: const Offset(0, 4))] : [],
                            ),
                            child: Row(children: [
                              getCategoryIcon(
                                cat['icon'] ?? '📋',
                                color: selected ? Colors.white : const Color(0xFF4F46E5),
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(cat['name'], style: TextStyle(color: selected ? Colors.white : Colors.grey.shade700, fontSize: 12, fontWeight: FontWeight.w600)),
                            ]),
                          ),
                        );
                      },
                    ),
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
                const SizedBox(width: 16),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _label(lang.t('dueDate')),
                  GestureDetector(
                    onTap: _pickDate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200)),
                      child: Row(children: [
                        const Icon(Icons.calendar_today, size: 16, color: Colors.indigo),
                        const SizedBox(width: 8),
                        Text('${_dueDate.day}/${_dueDate.month}/${_dueDate.year}', style: const TextStyle(fontSize: 13)),
                      ]),
                    ),
                  ),
                ])),
              ]),
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

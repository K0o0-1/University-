globalThis.LEARNING_MATERIAL_DATA={
  "schemaVersion": 2,
  "meta": {
    "id": "flutter-learning",
    "slug": "flutter-learning",
    "kind": "learning",
    "title": "Flutter Interactive Study",
    "subtitle": "شرح منظم + بنك 341 سؤال",
    "icon": "🧩",
    "storageKey": "flutter_learning_v1",
    "questionCount": 341,
    "moduleCount": 4,
    "chapterCount": 12,
    "sourcePolicy": "content-from-upload-and-university-bank-only",
    "sourceBankHash": "0x8997ebc6"
  },
  "modules": [
    {
      "id": "m1",
      "num": 1,
      "titleEn": "Dart",
      "titleAr": "Dart",
      "chapters": [
        "ch1",
        "ch2"
      ]
    },
    {
      "id": "m2",
      "num": 2,
      "titleEn": "Flutter Project & Tools",
      "titleAr": "مشروع Flutter والأدوات",
      "chapters": [
        "ch3",
        "ch4"
      ]
    },
    {
      "id": "m3",
      "num": 3,
      "titleEn": "Flutter UI & Application",
      "titleAr": "واجهة Flutter والتطبيق",
      "chapters": [
        "ch5",
        "ch6",
        "ch7",
        "ch8",
        "ch9"
      ]
    },
    {
      "id": "m4",
      "num": 4,
      "titleEn": "Packages & Data",
      "titleAr": "الحزم والبيانات",
      "chapters": [
        "ch10",
        "ch11",
        "ch12"
      ]
    }
  ],
  "chapters": [
    {
      "id": "ch1",
      "num": 1,
      "titleEn": "Dart Fundamentals",
      "titleAr": "أساسيات لغة Dart",
      "legacyTopicCount": 6,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch1-s1",
          "sectionTitle": "Flutter و Dart",
          "title": "Flutter و Dart",
          "facts": [
            "Flutter هو `Framework لتطوير تطبيقات متعددة المنصات`.",
            "اللغة المستخدمة في تطوير تطبيقات Flutter هي `Dart`.",
            "الإطار المستخدم لبناء واجهات التطبيقات باستخدام Dart هو `Flutter`.",
            "يمكن استخدام Flutter لتطوير تطبيقات لمنصات متعددة باستخدام Dart."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch1-s2",
          "sectionTitle": "بنية برنامج Dart",
          "title": "ملفات Dart وبداية التنفيذ",
          "facts": [
            "امتداد ملفات لغة Dart هو `.dart`.",
            "يبدأ تنفيذ برنامج Dart من `main()`.",
            "الرمز المستخدم لكتابة تعليق لسطر واحد هو `//`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch1-s3",
          "sectionTitle": "أنواع البيانات",
          "title": "Data Types",
          "facts": [
            "`int` يستخدم للأعداد الصحيحة.",
            "`double` يستخدم للأعداد العشرية.",
            "`String` يستخدم للنصوص.",
            "`bool` يستخدم للقيم `true` و `false`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch1-s4",
          "sectionTitle": "المتغيرات والثوابت و Null Safety",
          "title": "Variables & Constants",
          "facts": [
            "`final`: متغير يتم تعيين قيمته مرة واحدة.",
            "`dynamic`: يسمح بتغيير نوع المتغير أثناء التشغيل.",
            "`var`: يحدد النوع عند التعيين ولا يتغير نوع المتغير.",
            "الفرق بين `var` و `dynamic`: `var` يحدد النوع عند التعيين ولا يتغير نوع المتغير، بينما `dynamic` يسمح بتغيير النوع.",
            "الفرق بين `final` و `const`: `final` قيمته تحدد وقت التشغيل، بينما `const` يجب أن تكون ثابتة وقت الترجمة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch1-s8",
          "sectionTitle": "المتغيرات والثوابت و Null Safety",
          "title": "null safety",
          "facts": [
            "`null safety`: نظام يساعد على منع أخطاء التعامل مع القيم `null`.",
            "`String? name;`: المتغير يمكن أن يحتوي على `null`.",
            "`name!`: يخبر Dart أن القيمة ليست `null`.",
            "`late`: السماح بتعريف متغير سيتم تهيئته لاحقًا قبل استخدامه."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch1-s5",
          "sectionTitle": "المعاملات والتحكم في التدفق",
          "title": "Operators",
          "facts": [
            "`=`: إسناد قيمة لمتغير.",
            "`==`: يساوي.",
            "`!=`: لا يساوي."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch1-s6",
          "sectionTitle": "المعاملات والتحكم في التدفق",
          "title": "Conditions & Loops",
          "facts": [
            "`if`: تستخدم لإنشاء شرط.",
            "`while`: تتكرر طالما الشرط صحيح.",
            "`for`: تستخدم غالبًا عندما نعرف عدد مرات التكرار."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch1-s7",
          "sectionTitle": "الدوال",
          "title": "Functions",
          "facts": [
            "`void`: تستخدم لتعريف دالة لا تُرجع قيمة.",
            "عند كتابة `hello();` للدالة `void hello() { print(\"Hello\"); }` يتم استدعاء الدالة."
          ]
        }
      ]
    },
    {
      "id": "ch2",
      "num": 2,
      "titleEn": "Dart OOP",
      "titleAr": "البرمجة كائنية التوجه في Dart",
      "legacyTopicCount": 6,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s1",
          "sectionTitle": "مفاهيم OOP",
          "title": "OOP",
          "facts": [
            "`OOP` تعني `Object-Oriented Programming`.",
            "المبادئ الأربعة الأساسية في OOP هي: `Encapsulation, Inheritance, Polymorphism, Abstraction`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s2",
          "sectionTitle": "Class و Object",
          "title": "Class",
          "facts": [
            "`Class`: قالب/مخطط لإنشاء `Objects`.",
            "الكلمة المستخدمة لإنشاء Class في Dart هي `class`.",
            "مثال صحيح لتعريف Class: `class Person {}`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s3",
          "sectionTitle": "Class و Object",
          "title": "Object",
          "facts": [
            "`Object`: نسخة (`Instance`) من `Class`.",
            "مثال صحيح لإنشاء Object من Class: `Person person = Person();`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s4",
          "sectionTitle": "الأعضاء و Constructors",
          "title": "Property / Field و Method",
          "facts": [
            "المتغير الموجود داخل Class يسمى `Property / Field`.",
            "الدالة الموجودة داخل Class تسمى `Method`.",
            "في `class Person { String name = \"Ali\"; }` قيمة `name` هي `\"Ali\"`.",
            "`class Animal { void sound() { print(\"Sound\"); } }` ينشئ Class يحتوي على دالة `sound()`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s5",
          "sectionTitle": "الأعضاء و Constructors",
          "title": "Constructor",
          "facts": [
            "`Constructor`: دالة خاصة تُستخدم عند إنشاء Object.",
            "في `class Person { Person(); }` اسم الـ Constructor الافتراضي هو `Person()`.",
            "`Constructor Named`: Constructor له اسم محدد ويمكن وجود أكثر من Constructor مسمى في Class."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s13",
          "sectionTitle": "الأعضاء و Constructors",
          "title": "this",
          "facts": [
            "`this`: الإشارة إلى الكائن الحالي."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s6",
          "sectionTitle": "Encapsulation و Abstraction",
          "title": "Encapsulation",
          "facts": [
            "`Encapsulation`: تجميع البيانات والوظائف داخل Class والتحكم في الوصول إليها."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s9",
          "sectionTitle": "Encapsulation و Abstraction",
          "title": "Abstraction",
          "facts": [
            "`Abstraction`: إخفاء التفاصيل غير الضرورية وإظهار الوظائف الأساسية."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s7",
          "sectionTitle": "الوراثة و super و override",
          "title": "Inheritance",
          "facts": [
            "`Inheritance`: قدرة Class على وراثة خصائص ودوال من Class أخرى.",
            "الكلمة المستخدمة للوراثة في Dart هي `extends`.",
            "`extends`: وراثة Class من Class أخرى.",
            "`class Dog extends Animal {}` يعني أن `Dog` يرث من `Animal`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s10",
          "sectionTitle": "الوراثة و super و override",
          "title": "@override",
          "facts": [
            "`@override`: تستخدم لإعادة تعريف دالة موروثة من Class الأب."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s12",
          "sectionTitle": "الوراثة و super و override",
          "title": "super",
          "facts": [
            "`super`: الوصول إلى أعضاء أو Constructor الخاص بالـ Class الأب."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s8",
          "sectionTitle": "Polymorphism و Interfaces",
          "title": "Polymorphism",
          "facts": [
            "`Polymorphism`: إمكانية استخدام نفس الواجهة/الدالة بسلوك مختلف حسب الكائن."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch2-s11",
          "sectionTitle": "Polymorphism و Interfaces",
          "title": "extends vs implements",
          "facts": [
            "`extends` للوراثة من Class.",
            "`implements` لتطبيق واجهة/عقد Class."
          ]
        }
      ]
    },
    {
      "id": "ch3",
      "num": 3,
      "titleEn": "Flutter Project Structure",
      "titleAr": "هيكل مشروع Flutter",
      "legacyTopicCount": 5,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s1",
          "sectionTitle": "الكود ونقطة البداية",
          "title": "main.dart",
          "facts": [
            "الملف الرئيسي الشائع في مشروع Flutter هو `main.dart`.",
            "الملف الذي يحتوي عادةً على الدالة `main()` هو `main.dart`.",
            "الملف الرئيسي الذي يبدأ منه تنفيذ تطبيق Flutter عادةً هو `main.dart`.",
            "يوجد ملف `main.dart` عادةً في `lib/main.dart`.",
            "الملف الذي يحتوي على نقطة بداية التطبيق هو `lib/main.dart`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s2",
          "sectionTitle": "الكود ونقطة البداية",
          "title": "lib",
          "facts": [
            "مجلد `lib` يحتوي على كود Dart الأساسي للتطبيق.",
            "المجلد الذي يحتوي على كود التطبيق المكتوب بلغة Dart هو `lib`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s3",
          "sectionTitle": "إعدادات المشروع",
          "title": "pubspec.yaml",
          "facts": [
            "`pubspec.yaml` يحتوي على معلومات المشروع والحزم.",
            "`pubspec.yaml` يعرف معلومات المشروع والـ `dependencies` والـ `assets` وغيرها.",
            "يتم تعريف الـ Packages المستخدمة في مشروع Flutter داخل `pubspec.yaml`.",
            "يتم تسجيل Package التي تريد استخدامها في `pubspec.yaml`.",
            "يتم تعريف الـ Assets في `pubspec.yaml`.",
            "يحدد اسم المشروع ووصفه وإصداره.",
            "تكتب Dependencies مثل `http` و `provider` في `pubspec.yaml`.",
            "الملف المسؤول عن Dependencies في Flutter هو `pubspec.yaml`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s4",
          "sectionTitle": "إعدادات المشروع",
          "title": "pubspec.lock",
          "facts": [
            "`pubspec.lock`: يسجل الإصدارات التي تم حلها للاعتماديات في المشروع.",
            "وظيفته تثبيت/تسجيل إصدارات الاعتماديات التي تم حلها للمشروع."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s5",
          "sectionTitle": "Assets والاختبارات",
          "title": "assets",
          "facts": [
            "الصور والخطوط والملفات الثابتة توضع عادةً في `assets`.",
            "يمكن وضعها في مجلد مثل `assets` بعد تعريفه في `pubspec.yaml`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s12",
          "sectionTitle": "Assets والاختبارات",
          "title": "test",
          "facts": [
            "مجلد `test` يحتوي على ملفات الاختبارات (`Tests`).",
            "ملفات الاختبارات توجد عادةً في `test`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s6",
          "sectionTitle": "مجلدات المنصات",
          "title": "android",
          "facts": [
            "مجلد `android` يحتوي على ملفات وإعدادات خاصة بمنصة Android.",
            "المجلد الخاص بـ Android هو `android`.",
            "`AndroidManifest.xml`: تعريف معلومات وإعدادات مهمة لتطبيق Android مثل الصلاحيات وبعض مكونات التطبيق.",
            "إعدادات Gradle الخاصة بمشروع Android توجد في ملفات Gradle مثل `build.gradle` أو `build.gradle.kts`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s7",
          "sectionTitle": "مجلدات المنصات",
          "title": "ios",
          "facts": [
            "مجلد `ios` يحتوي على ملفات وإعدادات خاصة بمنصة iOS.",
            "المجلد الخاص بـ iOS هو `ios`.",
            "مجلد `Runner` داخل مشروع iOS يحتوي على ملفات التطبيق الخاصة بـ iOS.",
            "الملف المرتبط بإدارة Dependencies في مشاريع iOS عند استخدام CocoaPods هو `Podfile`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s8",
          "sectionTitle": "مجلدات المنصات",
          "title": "web",
          "facts": [
            "مجلد `web` يحتوي على ملفات خاصة بتشغيل التطبيق على الويب.",
            "المجلد الخاص بتطبيقات الويب هو `web`.",
            "الملف الرئيسي الشائع في مشروع Flutter Web هو `index.html`.",
            "`web/index.html`: صفحة HTML الأساسية لتطبيق Flutter Web."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s9",
          "sectionTitle": "مجلدات المنصات",
          "title": "windows",
          "facts": [
            "مجلد `windows`: ملفات وإعدادات تشغيل التطبيق على Windows."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s10",
          "sectionTitle": "مجلدات المنصات",
          "title": "linux",
          "facts": [
            "مجلد `linux`: ملفات وإعدادات تشغيل التطبيق على Linux."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s11",
          "sectionTitle": "مجلدات المنصات",
          "title": "macos",
          "facts": [
            "مجلد `macos`: ملفات وإعدادات تشغيل التطبيق على macOS."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s13",
          "sectionTitle": "ملفات البناء وبيئة التطوير",
          "title": "build",
          "facts": [
            "مجلد `build` يحتوي على ملفات ناتجة عن عمليات البناء (`Build artifacts`).",
            "مجلد `build` يحتوي على نواتج البناء ولا يُكتب فيه عادةً كود التطبيق."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s14",
          "sectionTitle": "ملفات البناء وبيئة التطوير",
          "title": ".dart_tool",
          "facts": [
            "مجلد `.dart_tool`: يحتوي على ملفات وأدوات داخلية ينشئها Dart/Flutter لإدارة المشروع والاعتماديات.",
            "لا يُفضل تعديل الملفات داخل `.dart_tool` يدويًا؛ فهي ملفات/بيانات مولدة وأدوات داخلية للمشروع."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch3-s15",
          "sectionTitle": "ملفات البناء وبيئة التطوير",
          "title": ".idea",
          "facts": [
            "مجلد `.idea`: ملفات إعدادات بيئة التطوير مثل Android Studio/IntelliJ."
          ]
        }
      ]
    },
    {
      "id": "ch4",
      "num": 4,
      "titleEn": "Flutter Commands",
      "titleAr": "أوامر Flutter",
      "legacyTopicCount": 5,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s1",
          "sectionTitle": "الإعداد والبيئة",
          "title": "flutter doctor",
          "facts": [
            "`flutter doctor`: التأكد من إعداد Flutter.",
            "`flutter doctor`: يفحص إعداد Flutter على الجهاز."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s8",
          "sectionTitle": "الإعداد والبيئة",
          "title": "flutter --version",
          "facts": [
            "`flutter --version`: معرفة إصدار Flutter.",
            "`flutter --version`: معرفة إصدارات Flutter والقناة الحالية ومعلومات البيئة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s9",
          "sectionTitle": "الإعداد والبيئة",
          "title": "flutter upgrade",
          "facts": [
            "`flutter upgrade`: تحديث Flutter إلى الإصدار الأحدث في القناة الحالية."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s10",
          "sectionTitle": "الإعداد والبيئة",
          "title": "flutter devices",
          "facts": [
            "`flutter devices`: معرفة الأجهزة المتصلة والمتاحة لتشغيل التطبيق.",
            "`flutter devices`: معرفة الأجهزة المتاحة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s2",
          "sectionTitle": "إنشاء وتشغيل وتنظيف المشروع",
          "title": "flutter create",
          "facts": [
            "`flutter create`: إنشاء مشروع Flutter جديد."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s3",
          "sectionTitle": "إنشاء وتشغيل وتنظيف المشروع",
          "title": "flutter run",
          "facts": [
            "`flutter run`: تشغيل تطبيق Flutter.",
            "`flutter run`: يستخدم عادةً لتشغيل مشروع Flutter."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s6",
          "sectionTitle": "إنشاء وتشغيل وتنظيف المشروع",
          "title": "flutter clean",
          "facts": [
            "`flutter clean`: حذف الملفات المؤقتة وملفات البناء.",
            "`flutter clean`: تنظيف ملفات البناء."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s4",
          "sectionTitle": "أوامر الحزم",
          "title": "flutter pub get",
          "facts": [
            "`flutter pub get`: تحميل الحزم الموجودة في المشروع.",
            "`flutter pub get`: تحميل الـ Packages الموجودة في `pubspec.yaml`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s5",
          "sectionTitle": "أوامر الحزم",
          "title": "flutter pub add",
          "facts": [
            "`flutter pub add package_name`: إضافة Package إلى مشروع Flutter.",
            "`flutter pub add sqflite`: إضافة `sqflite` للمشروع."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s7",
          "sectionTitle": "الاختبار وجودة الكود",
          "title": "flutter test",
          "facts": [
            "`flutter test`: تشغيل اختبارات Flutter."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s13",
          "sectionTitle": "الاختبار وجودة الكود",
          "title": "dart format .",
          "facts": [
            "`dart format .`: تشغيل Dart formatter على ملفات المشروع."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s14",
          "sectionTitle": "الاختبار وجودة الكود",
          "title": "flutter analyze",
          "facts": [
            "`flutter analyze`: تحليل كود Dart/Flutter واكتشاف المشاكل."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s11",
          "sectionTitle": "أوامر البناء",
          "title": "flutter build apk",
          "facts": [
            "`flutter build apk`: بناء نسخة Android APK."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch4-s12",
          "sectionTitle": "أوامر البناء",
          "title": "flutter build appbundle",
          "facts": [
            "`flutter build appbundle`: بناء نسخة Android App Bundle."
          ]
        }
      ]
    },
    {
      "id": "ch5",
      "num": 5,
      "titleEn": "Widgets, State & Lifecycle",
      "titleAr": "الواجهات والحالة ودورة الحياة",
      "legacyTopicCount": 5,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s1",
          "sectionTitle": "أنواع Widgets",
          "title": "Widget",
          "facts": [
            "`Widget` هو العنصر الأساسي الذي تُبنى منه واجهة Flutter.",
            "نتعامل بشكل شائع مع نوعين أساسيين: `Stateless` و `Stateful`.",
            "`String` ليس Widget."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s2",
          "sectionTitle": "أنواع Widgets",
          "title": "StatelessWidget",
          "facts": [
            "`StatelessWidget`: Widget لا تمتلك حالة قابلة للتغيير أثناء التشغيل.",
            "تستخدم عندما تكون الواجهة ثابتة ولا تحتاج إلى تغيير داخلي.",
            "لا يمكن استخدام `setState()` مباشرةً داخل StatelessWidget.",
            "مثال مناسب: نص ثابت في الشاشة.",
            "عنوان ثابت مثل `\"Welcome\"` يناسب StatelessWidget.",
            "وظيفتها إنشاء Widget لا تعتمد على حالة داخلية متغيرة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s3",
          "sectionTitle": "أنواع Widgets",
          "title": "StatefulWidget",
          "facts": [
            "`StatefulWidget`: Widget يمكن أن تتغير حالتها أثناء تشغيل التطبيق.",
            "تستخدم عندما نحتاج إلى تغيير البيانات أو الواجهة أثناء التشغيل.",
            "تستخدم عندما نحتاج إلى حالة يمكن أن تتغير أثناء التشغيل.",
            "مناسبة لواجهة تعتمد على بيانات تتغير أثناء تشغيل التطبيق.",
            "مثال مناسب: عداد يتغير عند الضغط على زر.",
            "مناسبة لعمل Checkbox يتغير عند الضغط عليه.",
            "ليس كل StatefulWidget يتغير تلقائيًا؛ هو فقط يسمح بإدارة حالة يمكن أن تتغير."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s4",
          "sectionTitle": "أنواع Widgets",
          "title": "StatelessWidget vs StatefulWidget",
          "facts": [
            "الفرق الأساسي: StatefulWidget يمكن أن تتغير حالته أثناء التشغيل.",
            "`Stateless = واجهة تعتمد على بيانات لا تتغير داخليًا`.",
            "`Stateful = واجهة لها حالة يمكن أن تتغير`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s5",
          "sectionTitle": "State وإعادة بناء الواجهة",
          "title": "State",
          "facts": [
            "الحالة المتغيرة في StatefulWidget تحفظ داخل كلاس `State`.",
            "StatefulWidget يرتبط بكلاس State لتخزين الحالة المتغيرة.",
            "قيمة العداد التي تتغير عند الضغط على زر مثال على حالة متغيرة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s6",
          "sectionTitle": "State وإعادة بناء الواجهة",
          "title": "build()",
          "facts": [
            "`build()` هي الدالة الأساسية المستخدمة لبناء واجهة Widget.",
            "تستخدم لبناء واجهة StatelessWidget.",
            "كل من StatelessWidget و StatefulWidget يستخدمان `build()` لبناء الواجهة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s7",
          "sectionTitle": "State وإعادة بناء الواجهة",
          "title": "setState()",
          "facts": [
            "`setState()` تستخدم لإخبار Flutter بأن هناك تغييرًا في الحالة.",
            "عند استدعائها يتم إعادة بناء الواجهة لتظهر الحالة الجديدة.",
            "عند تغيير قيمة متغير داخل StatefulWidget تستخدم عادةً `setState()` لتحديث الشاشة.",
            "تستخدم لتحديث حالة StatefulWidget وإعادة بناء واجهتها بعد تغيير الحالة.",
            "`setState()` لا تنشئ State جديدة؛ تخبر Flutter بأن الحالة تغيرت وتطلب إعادة بناء الواجهة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s8",
          "sectionTitle": "دورة الحياة",
          "title": "initState()",
          "facts": [
            "`initState()` يتم استدعاؤها عادةً مرة واحدة عند إنشاء حالة StatefulWidget."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s9",
          "sectionTitle": "دورة الحياة",
          "title": "dispose()",
          "facts": [
            "`dispose()` تستخدم لتنظيف الموارد قبل إزالة الـ State."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s10",
          "sectionTitle": "Widget Tree و BuildContext",
          "title": "Widget vs Element",
          "facts": [
            "Widget تصف الواجهة.",
            "Element تمثل وجودها في شجرة الواجهة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s11",
          "sectionTitle": "Widget Tree و BuildContext",
          "title": "Widget Tree",
          "facts": [
            "`Widget Tree`: هيكل هرمي يوضح علاقة الـ Widgets ببعضها."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s12",
          "sectionTitle": "Widget Tree و BuildContext",
          "title": "BuildContext",
          "facts": [
            "`BuildContext`: يمثل موقع الـ Widget داخل شجرة الـ Widgets ويسمح بالوصول إلى معلومات مرتبطة بها."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s13",
          "sectionTitle": "Hot Reload و Hot Restart",
          "title": "Hot Reload",
          "facts": [
            "`Hot Reload`: تطبيق تغييرات الكود بسرعة مع الحفاظ غالبًا على حالة التطبيق الحالية.",
            "Hot Reload هو الذي يحافظ عادةً على حالة التطبيق."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch5-s14",
          "sectionTitle": "Hot Reload و Hot Restart",
          "title": "Hot Restart",
          "facts": [
            "`Hot Restart`: إعادة تشغيل التطبيق وإعادة تهيئة الحالة."
          ]
        }
      ]
    },
    {
      "id": "ch6",
      "num": 6,
      "titleEn": "App & Page Structure",
      "titleAr": "هيكل التطبيق والصفحات",
      "legacyTopicCount": 3,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch6-s1",
          "sectionTitle": "جذر التطبيق",
          "title": "MaterialApp",
          "facts": [
            "`MaterialApp`: الأداة المستخدمة لإنشاء تطبيق Material Design.",
            "`MaterialApp` تعتبر الجذر الشائع لتطبيق Flutter باستخدام Material Design."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch6-s2",
          "sectionTitle": "جذر التطبيق",
          "title": "CupertinoApp",
          "facts": [
            "`CupertinoApp`: الأداة المستخدمة لإنشاء تطبيق يعتمد على Cupertino Design."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch6-s3",
          "sectionTitle": "بنية الصفحة",
          "title": "Scaffold",
          "facts": [
            "`Scaffold`: Widget يوفر الهيكل الأساسي لواجهة الصفحة.",
            "`Scaffold`: الأداة التي توفر/تنشئ الهيكل الأساسي للصفحة.",
            "مثال صحيح: `Scaffold(appBar: ..., body: ...)`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch6-s4",
          "sectionTitle": "بنية الصفحة",
          "title": "AppBar / appBar",
          "facts": [
            "الخاصية `appBar` تستخدم لإضافة شريط علوي للصفحة.",
            "`AppBar` تستخدم لإنشاء شريط علوي.",
            "يوضع AppBar عادةً داخل خاصية `appBar` في Scaffold.",
            "الخاصية في Scaffold المستخدمة للشريط العلوي هي `appBar`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch6-s5",
          "sectionTitle": "بنية الصفحة",
          "title": "body",
          "facts": [
            "الخاصية `body` تستخدم لوضع المحتوى الرئيسي داخل Scaffold.",
            "وظيفة `body` هي وضع المحتوى الرئيسي للصفحة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch6-s6",
          "sectionTitle": "عناصر وإجراءات الصفحة",
          "title": "floatingActionButton",
          "facts": [
            "الخاصية `floatingActionButton` تستخدم لإضافة زر عائم.",
            "وظيفتها إضافة زر عائم لتنفيذ إجراء معين."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch6-s7",
          "sectionTitle": "عناصر وإجراءات الصفحة",
          "title": "drawer / Drawer",
          "facts": [
            "الخاصية `drawer` تستخدم لإضافة قائمة جانبية (`Drawer`).",
            "`Drawer` هي الأداة المستخدمة لإضافة قائمة جانبية."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch6-s8",
          "sectionTitle": "عناصر وإجراءات الصفحة",
          "title": "bottomNavigationBar / BottomNavigationBar",
          "facts": [
            "الخاصية `bottomNavigationBar` تستخدم لإضافة شريط تنقل سفلي.",
            "`BottomNavigationBar` هي الأداة المستخدمة لإنشاء شريط تنقل سفلي."
          ]
        }
      ]
    },
    {
      "id": "ch7",
      "num": 7,
      "titleEn": "Layout Widgets",
      "titleAr": "عناصر التخطيط",
      "legacyTopicCount": 6,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s1",
          "sectionTitle": "Row و Column",
          "title": "Column",
          "facts": [
            "`Column` تستخدم لترتيب العناصر بشكل رأسي."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s2",
          "sectionTitle": "Row و Column",
          "title": "Row",
          "facts": [
            "`Row` تستخدم لترتيب العناصر بشكل أفقي.",
            "Row لا يسمح بعدد واحد فقط من الـ Widgets؛ يستخدم `children` لاحتواء عدة Widgets."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s18",
          "sectionTitle": "Row و Column",
          "title": "child و children",
          "facts": [
            "`children` تحتوي على عدة Widgets في Row و Column.",
            "`child` تحتوي عادةً على Widget واحدة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s3",
          "sectionTitle": "المحاذاة والطبقات",
          "title": "Stack",
          "facts": [
            "`Stack` تسمح بوضع Widgets فوق بعضها."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s5",
          "sectionTitle": "المحاذاة والطبقات",
          "title": "Center",
          "facts": [
            "`Center` تستخدم لتوسيط عنصر."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s6",
          "sectionTitle": "المحاذاة والطبقات",
          "title": "Align",
          "facts": [
            "`Align` تستخدم للتحكم بمحاذاة العنصر داخل المساحة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s7",
          "sectionTitle": "المسافات والأحجام",
          "title": "Padding",
          "facts": [
            "`Padding` تستخدم لإضافة مسافة داخلية حول عنصر أو Widget."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s8",
          "sectionTitle": "المسافات والأحجام",
          "title": "SizedBox",
          "facts": [
            "`SizedBox` تستخدم لإضافة مسافة بين العناصر.",
            "تستخدم لإعطاء العنصر حجمًا محددًا أو إضافة مساحة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s9",
          "sectionTitle": "المسافات والأحجام",
          "title": "Expanded",
          "facts": [
            "`Expanded` تجعل العنصر يأخذ المساحة المتاحة داخل Row أو Column.",
            "إذا وضعت Expanded داخل Column فإنها تجعله يأخذ المساحة المتاحة وفق قيود الـ Column."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s17",
          "sectionTitle": "المسافات والأحجام",
          "title": "Padding vs Margin",
          "facts": [
            "`Padding` يضيف مساحة داخل حدود العنصر.",
            "المسافة الخارجية يمكن تحقيقها مثلًا باستخدام `Container.margin`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s4",
          "sectionTitle": "Container و Decoration",
          "title": "Container",
          "facts": [
            "`Container` تستخدم لإضافة مساحة أو صندوق يمكن التحكم بحجمه ولونه.",
            "لا يجب أن تحتوي Container دائمًا على `child`؛ يمكن استخدامها بدون child."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s14",
          "sectionTitle": "Container و Decoration",
          "title": "BoxDecoration",
          "facts": [
            "`BoxDecoration` تستخدم لإضافة حواف دائرية أو خلفية مخصصة لعنصر."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s10",
          "sectionTitle": "القوائم والشبكات القابلة للتمرير",
          "title": "ListView",
          "facts": [
            "`ListView` تستخدم لإظهار/عرض قائمة من العناصر يمكن تمريرها."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s11",
          "sectionTitle": "القوائم والشبكات القابلة للتمرير",
          "title": "ListView.builder",
          "facts": [
            "`ListView.builder` تستخدم لعرض مجموعة من العناصر على شكل قائمة قابلة للتمرير بكفاءة.",
            "مناسبة لعرض عناصر كثيرة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s12",
          "sectionTitle": "القوائم والشبكات القابلة للتمرير",
          "title": "GridView",
          "facts": [
            "`GridView` تستخدم لترتيب عدة عناصر على شكل شبكة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s13",
          "sectionTitle": "القوائم والشبكات القابلة للتمرير",
          "title": "SingleChildScrollView",
          "facts": [
            "`SingleChildScrollView` تجعل المحتوى قابلًا للتمرير."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s15",
          "sectionTitle": "التخطيط المرن",
          "title": "Wrap",
          "facts": [
            "`Wrap` مناسبة لعرض عناصر متجاورة مع إمكانية انتقالها إلى سطر جديد."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch7-s16",
          "sectionTitle": "التخطيط المرن",
          "title": "MediaQuery",
          "facts": [
            "`MediaQuery`: الحصول على معلومات عن حجم الشاشة واتجاهها وبعض خصائص الجهاز."
          ]
        }
      ]
    },
    {
      "id": "ch8",
      "num": 8,
      "titleEn": "Display & Input Widgets",
      "titleAr": "عناصر العرض والإدخال",
      "legacyTopicCount": 5,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s1",
          "sectionTitle": "النصوص والأيقونات",
          "title": "Text",
          "facts": [
            "`Text` تستخدم لعرض نص على الشاشة.",
            "Text من Widgets الخاصة بالعرض."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s5",
          "sectionTitle": "النصوص والأيقونات",
          "title": "Icon",
          "facts": [
            "`Icon` تستخدم لعرض أيقونة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s2",
          "sectionTitle": "الصور",
          "title": "Image",
          "facts": [
            "`Image` تستخدم لعرض/إضافة صورة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s3",
          "sectionTitle": "الصور",
          "title": "Image.network",
          "facts": [
            "`Image.network` تستخدم لعرض صورة من الإنترنت."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s4",
          "sectionTitle": "الصور",
          "title": "Image.asset",
          "facts": [
            "الطريقة الصحيحة للوصول إلى صورة من Assets هي: `Image.asset('assets/image.png')`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s6",
          "sectionTitle": "إدخال النص",
          "title": "TextField",
          "facts": [
            "`TextField` تستخدم لإدخال النص من المستخدم."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s7",
          "sectionTitle": "التحميل والرسائل",
          "title": "CircularProgressIndicator",
          "facts": [
            "`CircularProgressIndicator` تستخدم لإظهار دائرة تحميل."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s8",
          "sectionTitle": "التحميل والرسائل",
          "title": "SnackBar",
          "facts": [
            "`SnackBar` تستخدم لإظهار رسالة مؤقتة في أسفل الشاشة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s9",
          "sectionTitle": "التحميل والرسائل",
          "title": "AlertDialog",
          "facts": [
            "`AlertDialog` تستخدم لإظهار نافذة حوار للمستخدم."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s10",
          "sectionTitle": "عناصر الاختيار",
          "title": "Checkbox",
          "facts": [
            "`Checkbox` تستخدم لإنشاء مربع اختيار."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s11",
          "sectionTitle": "عناصر الاختيار",
          "title": "Radio",
          "facts": [
            "`Radio` تستخدم لاختيار قيمة واحدة من عدة خيارات."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch8-s12",
          "sectionTitle": "عناصر الاختيار",
          "title": "Switch",
          "facts": [
            "`Switch` تستخدم لإنشاء مفتاح تشغيل وإيقاف."
          ]
        }
      ]
    },
    {
      "id": "ch9",
      "num": 9,
      "titleEn": "Buttons & Navigation",
      "titleAr": "الأزرار والتنقل",
      "legacyTopicCount": 4,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s1",
          "sectionTitle": "أساسيات الأزرار",
          "title": "Button",
          "facts": [
            "وظيفة Button في Flutter هي تنفيذ أمر عند ضغط المستخدم عليه.",
            "يمكن استخدام `ElevatedButton` لإنشاء زر قابل للضغط.",
            "أشهر أنواع الأزرار: `ElevatedButton, TextButton, OutlinedButton, IconButton`.",
            "`TextField` ليس Button."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s9",
          "sectionTitle": "أساسيات الأزرار",
          "title": "child داخل الزر",
          "facts": [
            "`child` تحدد المحتوى الذي يظهر داخل الزر.",
            "يمكن وضع `Text` أو `Icon` أو `Row` داخل child للزر.",
            "`TextButton` و `ElevatedButton` و `OutlinedButton` يمكن أن تحتوي على `Icon` و `Text` معًا."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s2",
          "sectionTitle": "أنواع الأزرار",
          "title": "ElevatedButton",
          "facts": [
            "`ElevatedButton` تستخدم لإنشاء زر بارز/مرتفع.",
            "مناسبة غالبًا لإجراء رئيسي مثل `\"تسجيل الدخول\"`.",
            "مناسبة لإجراء رئيسي مثل `\"حفظ\"` أو `\"تسجيل الدخول\"` عندما نريد إبراز الإجراء.",
            "مناسبة غالبًا للإجراء الرئيسي في الصفحة.",
            "مثال صحيح: `ElevatedButton(onPressed: () {}, child: Text(\"اضغط\"))`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s3",
          "sectionTitle": "أنواع الأزرار",
          "title": "TextButton",
          "facts": [
            "`TextButton` تستخدم لإنشاء زر نصي بسيط.",
            "تكون غالبًا بدون خلفية بارزة وتعرض نصًا.",
            "مناسبة غالبًا للأفعال الثانوية مثل `\"إلغاء\"`.",
            "مناسبة لزر مثل `\"إلغاء\"` أو إجراء ثانوي."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s4",
          "sectionTitle": "أنواع الأزرار",
          "title": "OutlinedButton",
          "facts": [
            "`OutlinedButton` تتميز بوجود إطار حولها.",
            "تحتوي عادةً على حدود (`Border`) واضحة.",
            "مناسبة لزر `\"التالي\"` مع وجود إطار واضح حوله."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s5",
          "sectionTitle": "أنواع الأزرار",
          "title": "IconButton",
          "facts": [
            "`IconButton` تستخدم لإنشاء زر يحتوي على أيقونة.",
            "مناسبة لزر يحتوي على أيقونة فقط مثل زر الحذف.",
            "تستخدم لعرض أيقونة قابلة للضغط.",
            "مناسبة لزر حذف يحتوي على رمز سلة المهملات.",
            "الفرق بين `Icon` و `IconButton`: Icon لعرض الأيقونة، و IconButton تجعل الأيقونة قابلة للضغط."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s6",
          "sectionTitle": "حالات الأزرار والإجراء العائم",
          "title": "FloatingActionButton",
          "facts": [
            "`FloatingActionButton` يستخدم غالبًا كزر عائم دائري لتنفيذ إجراء رئيسي.",
            "يستخدم غالبًا مع Scaffold كزر عائم."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s7",
          "sectionTitle": "حالات الأزرار والإجراء العائم",
          "title": "onPressed",
          "facts": [
            "`onPressed` تحدد ما يحدث عند الضغط على الزر.",
            "القيمة التي توضع عادةً في `onPressed` هي دالة (`Function`).",
            "عند الضغط على زر يحتوي على `onPressed: () { print(\"Hello\"); }` يتم تنفيذ الكود الموجود داخل الدالة."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s8",
          "sectionTitle": "حالات الأزرار والإجراء العائم",
          "title": "onPressed: null",
          "facts": [
            "إذا كانت قيمة `onPressed` تساوي `null` في أزرار Material المعتادة يصبح الزر غير قابل للضغط (`معطّلًا`).",
            "`ElevatedButton(onPressed: null, child: Text(\"Login\"))` يكون معطّلًا لأنه لا يحتوي على دالة في onPressed.",
            "إذا كان `onPressed: null` في ElevatedButton يصبح الزر `Disabled`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch9-s10",
          "sectionTitle": "التنقل",
          "title": "Navigator",
          "facts": [
            "`Navigator` تستخدم للتنقل بين الصفحات."
          ]
        }
      ]
    },
    {
      "id": "ch10",
      "num": 10,
      "titleEn": "Packages",
      "titleAr": "الحزم والإضافات",
      "legacyTopicCount": 5,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s1",
          "sectionTitle": "منظومة Packages",
          "title": "Package",
          "facts": [
            "`Package` في Flutter: مكتبة تحتوي على كود جاهز يمكن استخدامه في المشروع."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s2",
          "sectionTitle": "منظومة Packages",
          "title": "Package vs Plugin",
          "facts": [
            "Package مكتبة Dart/Flutter.",
            "Plugin قد يوفر تكاملًا مع خصائص المنصة الأصلية."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s3",
          "sectionTitle": "منظومة Packages",
          "title": "pub.dev",
          "facts": [
            "`pub.dev` هو الموقع الرسمي الذي يوفر Packages لـ Dart و Flutter."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s4",
          "sectionTitle": "الاتصال بالشبكة",
          "title": "http",
          "facts": [
            "`http` تستخدم للتعامل مع طلبات HTTP والاتصال بالـ APIs.",
            "للاتصال بـ REST API يمكن استخدام `http`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s5",
          "sectionTitle": "الاتصال بالشبكة",
          "title": "dio",
          "facts": [
            "`dio` بديل شائع لـ `http` لإجراء طلبات الشبكة ويوفر ميزات إضافية."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s6",
          "sectionTitle": "إدارة الحالة",
          "title": "provider",
          "facts": [
            "`provider` تستخدم لإدارة الحالة (`State Management`)."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s7",
          "sectionTitle": "خدمات الجهاز والمنصة",
          "title": "geolocator",
          "facts": [
            "`geolocator` تستخدم للحصول على موقع الجهاز GPS.",
            "تستخدم للحصول على إحداثيات GPS للمستخدم."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s8",
          "sectionTitle": "خدمات الجهاز والمنصة",
          "title": "image_picker",
          "facts": [
            "`image_picker` تستخدم لفتح الكاميرا أو اختيار الصور من الجهاز.",
            "تستخدم لاختيار صورة من Gallery."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s9",
          "sectionTitle": "خدمات الجهاز والمنصة",
          "title": "flutter_local_notifications",
          "facts": [
            "`flutter_local_notifications` تستخدم لإرسال الإشعارات المحلية."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s12",
          "sectionTitle": "خدمات الجهاز والمنصة",
          "title": "url_launcher",
          "facts": [
            "`url_launcher`: فتح روابط URL والتطبيقات الخارجية مثل المتصفح والهاتف."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s10",
          "sectionTitle": "الأدوات والملفات",
          "title": "intl",
          "facts": [
            "`intl` تستخدم لتنسيق التواريخ والأرقام والعملات."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch10-s11",
          "sectionTitle": "الأدوات والملفات",
          "title": "path_provider",
          "facts": [
            "`path_provider` تستخدم للوصول إلى مسارات الملفات الخاصة بالتطبيق."
          ]
        }
      ]
    },
    {
      "id": "ch11",
      "num": 11,
      "titleEn": "Databases & Local Storage",
      "titleAr": "قواعد البيانات والتخزين المحلي",
      "legacyTopicCount": 5,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch11-s1",
          "sectionTitle": "أساسيات قواعد البيانات",
          "title": "Database",
          "facts": [
            "قاعدة البيانات: مكان لتخزين وتنظيم البيانات واسترجاعها."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch11-s7",
          "sectionTitle": "أساسيات قواعد البيانات",
          "title": "SQL vs NoSQL",
          "facts": [
            "SQL تعتمد عادةً على جداول وعلاقات.",
            "NoSQL تستخدم نماذج مرنة مثل Documents حسب النظام."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch11-s2",
          "sectionTitle": "التخزين المحلي البسيط",
          "title": "shared_preferences",
          "facts": [
            "`shared_preferences` تستخدم لتخزين بيانات بسيطة محليًا مثل الإعدادات.",
            "مناسبة لحفظ اسم المستخدم محليًا."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch11-s3",
          "sectionTitle": "SQLite و sqflite",
          "title": "SQLite",
          "facts": [
            "`SQLite`: قاعدة بيانات علائقية محلية.",
            "تستخدم لتخزين البيانات محليًا داخل الجهاز.",
            "يتم تخزين قاعدة بيانات SQLite عادةً على جهاز المستخدم.",
            "مناسبة للتخزين المحلي.",
            "إذا كان التطبيق يحتاج إلى العمل مع بيانات محلية بدون إنترنت فالخيار المناسب هو `SQLite / sqflite`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch11-s4",
          "sectionTitle": "SQLite و sqflite",
          "title": "sqflite",
          "facts": [
            "`sqflite` مكتبة/Package تستخدم للتعامل مع SQLite في Flutter.",
            "`sqflite` هي Package شائعة للتعامل مع SQLite في Flutter.",
            "وظيفة `sqflite`: التعامل مع قاعدة بيانات SQLite في Flutter."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch11-s5",
          "sectionTitle": "المفاتيح والعلاقات",
          "title": "Primary Key vs Foreign Key",
          "facts": [
            "`Primary Key` يميز السجل داخل جدوله.",
            "`Foreign Key` يربط سجلًا بجدول آخر."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch11-s6",
          "sectionTitle": "عمليات CRUD",
          "title": "CRUD",
          "facts": [
            "`CRUD` تعني `Create, Read, Update, Delete`.",
            "العملية المستخدمة لقراءة البيانات هي `Read`."
          ]
        }
      ]
    },
    {
      "id": "ch12",
      "num": 12,
      "titleEn": "Firebase & Firestore",
      "titleAr": "قاعدة بيانات Firebase و Firestore",
      "legacyTopicCount": 6,
      "blocks": [
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s1",
          "sectionTitle": "Firebase و Core",
          "title": "Firebase",
          "facts": [
            "Firebase ليست قاعدة بيانات محلية فقط؛ توفر خدمات سحابية متعددة ومنها قواعد بيانات."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s2",
          "sectionTitle": "Firebase و Core",
          "title": "firebase_core",
          "facts": [
            "`firebase_core` تستخدم للتعامل مع Firebase Core في Flutter.",
            "`firebase_core` تستخدم لتهيئة Firebase في Flutter."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s3",
          "sectionTitle": "المصادقة",
          "title": "firebase_auth",
          "facts": [
            "`firebase_auth` تستخدم للتعامل مع Firebase Authentication.",
            "إذا أردت استخدام Firebase Authentication فالـ Package هي `firebase_auth`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s4",
          "sectionTitle": "Cloud Firestore",
          "title": "Cloud Firestore",
          "facts": [
            "`Cloud Firestore` خدمة من Firebase تستخدم كقاعدة بيانات NoSQL سحابية.",
            "نوع قاعدة بيانات Cloud Firestore هو `NoSQL`.",
            "لحفظ بيانات المستخدمين على السحابة الخيار المناسب هو `Cloud Firestore`.",
            "لتخزين البيانات على السحابة ومزامنتها الخيار المناسب هو `Cloud Firestore`.",
            "إذا كان المطلوب مشاركة البيانات بين عدة أجهزة للمستخدم فالخيار الأنسب قاعدة بيانات سحابية مثل Cloud Firestore."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s5",
          "sectionTitle": "Cloud Firestore",
          "title": "cloud_firestore",
          "facts": [
            "`cloud_firestore` هي Package المستخدمة مع Cloud Firestore.",
            "لتخزين بيانات المستخدم في Cloud Firestore تستخدم `cloud_firestore`."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s7",
          "sectionTitle": "بنية بيانات Firestore",
          "title": "Collections و Documents",
          "facts": [
            "البيانات في Cloud Firestore تنظم على شكل `Collections` و `Documents`.",
            "`Collection`: مجموعة من Documents.",
            "`Document`: سجل يحتوي على بيانات على شكل Fields."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s8",
          "sectionTitle": "بنية بيانات Firestore",
          "title": "Firestore hierarchy",
          "facts": [
            "العلاقة الصحيحة في Firestore هي: `Database → Collections → Documents → Fields`"
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s6",
          "sectionTitle": "Firebase Storage",
          "title": "Firebase Storage",
          "facts": [
            "`firebase_storage` تستخدم لتخزين الملفات والصور في Firebase Storage."
          ]
        },
        {
          "type": "source-section",
          "sourceSectionId": "ch12-s9",
          "sectionTitle": "SQLite مقابل Firestore",
          "title": "SQLite vs Firestore",
          "facts": [
            "`SQLite` محلية وعلائقية.",
            "`Firestore` سحابية و `NoSQL`."
          ]
        }
      ]
    }
  ],
  "questionMap": [
    {
      "number": 1,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s2"
    },
    {
      "number": 2,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s2"
    },
    {
      "number": 3,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s4"
    },
    {
      "number": 4,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s8"
    },
    {
      "number": 5,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s3"
    },
    {
      "number": 6,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s2"
    },
    {
      "number": 7,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s1"
    },
    {
      "number": 8,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s1"
    },
    {
      "number": 9,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s1"
    },
    {
      "number": 10,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s3"
    },
    {
      "number": 11,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s3"
    },
    {
      "number": 12,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s3"
    },
    {
      "number": 13,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s3"
    },
    {
      "number": 14,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s4"
    },
    {
      "number": 15,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s4"
    },
    {
      "number": 16,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s5"
    },
    {
      "number": 17,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s5"
    },
    {
      "number": 18,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s5"
    },
    {
      "number": 19,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s6"
    },
    {
      "number": 20,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s6"
    },
    {
      "number": 21,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s6"
    },
    {
      "number": 22,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s7"
    },
    {
      "number": 23,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s3"
    },
    {
      "number": 24,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s3"
    },
    {
      "number": 25,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s4"
    },
    {
      "number": 26,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s7"
    },
    {
      "number": 27,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s4"
    },
    {
      "number": 28,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s8"
    },
    {
      "number": 29,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s8"
    },
    {
      "number": 30,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s8"
    },
    {
      "number": 31,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s8"
    },
    {
      "number": 32,
      "chapterId": "ch1",
      "sourceSectionId": "ch1-s1"
    },
    {
      "number": 33,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s1"
    },
    {
      "number": 34,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s2"
    },
    {
      "number": 35,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s3"
    },
    {
      "number": 36,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s2"
    },
    {
      "number": 37,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s2"
    },
    {
      "number": 38,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s3"
    },
    {
      "number": 39,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s5"
    },
    {
      "number": 40,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s5"
    },
    {
      "number": 41,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s6"
    },
    {
      "number": 42,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s7"
    },
    {
      "number": 43,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s7"
    },
    {
      "number": 44,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s7"
    },
    {
      "number": 45,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s8"
    },
    {
      "number": 46,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s9"
    },
    {
      "number": 47,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s1"
    },
    {
      "number": 48,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s4"
    },
    {
      "number": 49,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s4"
    },
    {
      "number": 50,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s7"
    },
    {
      "number": 51,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s10"
    },
    {
      "number": 52,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s11"
    },
    {
      "number": 53,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s12"
    },
    {
      "number": 54,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s13"
    },
    {
      "number": 55,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s4"
    },
    {
      "number": 56,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s4"
    },
    {
      "number": 57,
      "chapterId": "ch2",
      "sourceSectionId": "ch2-s5"
    },
    {
      "number": 58,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s1"
    },
    {
      "number": 59,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 60,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s1"
    },
    {
      "number": 61,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 62,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s5"
    },
    {
      "number": 63,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s2"
    },
    {
      "number": 64,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s2"
    },
    {
      "number": 65,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 66,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 67,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s1"
    },
    {
      "number": 68,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s1"
    },
    {
      "number": 69,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s2"
    },
    {
      "number": 70,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 71,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s4"
    },
    {
      "number": 72,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s6"
    },
    {
      "number": 73,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s7"
    },
    {
      "number": 74,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s8"
    },
    {
      "number": 75,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s11"
    },
    {
      "number": 76,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s9"
    },
    {
      "number": 77,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s10"
    },
    {
      "number": 78,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s12"
    },
    {
      "number": 79,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s13"
    },
    {
      "number": 80,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s6"
    },
    {
      "number": 81,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s6"
    },
    {
      "number": 82,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s7"
    },
    {
      "number": 83,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s7"
    },
    {
      "number": 84,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s5"
    },
    {
      "number": 85,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 86,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s8"
    },
    {
      "number": 87,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s8"
    },
    {
      "number": 88,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s4"
    },
    {
      "number": 89,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 90,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 91,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s14"
    },
    {
      "number": 92,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s14"
    },
    {
      "number": 93,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s15"
    },
    {
      "number": 94,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s3"
    },
    {
      "number": 95,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s2"
    },
    {
      "number": 96,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s12"
    },
    {
      "number": 97,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s6"
    },
    {
      "number": 98,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s7"
    },
    {
      "number": 99,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s8"
    },
    {
      "number": 100,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s13"
    },
    {
      "number": 101,
      "chapterId": "ch3",
      "sourceSectionId": "ch3-s1"
    },
    {
      "number": 102,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s1"
    },
    {
      "number": 103,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s2"
    },
    {
      "number": 104,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s3"
    },
    {
      "number": 105,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s4"
    },
    {
      "number": 106,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s5"
    },
    {
      "number": 107,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s6"
    },
    {
      "number": 108,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s7"
    },
    {
      "number": 109,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s8"
    },
    {
      "number": 110,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s9"
    },
    {
      "number": 111,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s10"
    },
    {
      "number": 112,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s8"
    },
    {
      "number": 113,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s11"
    },
    {
      "number": 114,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s12"
    },
    {
      "number": 115,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s13"
    },
    {
      "number": 116,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s14"
    },
    {
      "number": 117,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s3"
    },
    {
      "number": 118,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s1"
    },
    {
      "number": 119,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s2"
    },
    {
      "number": 120,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s3"
    },
    {
      "number": 121,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s4"
    },
    {
      "number": 122,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s6"
    },
    {
      "number": 123,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s10"
    },
    {
      "number": 124,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s4"
    },
    {
      "number": 125,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s5"
    },
    {
      "number": 126,
      "chapterId": "ch4",
      "sourceSectionId": "ch4-s5"
    },
    {
      "number": 127,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s1"
    },
    {
      "number": 128,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s2"
    },
    {
      "number": 129,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s4"
    },
    {
      "number": 130,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 131,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s2"
    },
    {
      "number": 132,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 133,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s6"
    },
    {
      "number": 134,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s5"
    },
    {
      "number": 135,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s7"
    },
    {
      "number": 136,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s7"
    },
    {
      "number": 137,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s8"
    },
    {
      "number": 138,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s9"
    },
    {
      "number": 139,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s6"
    },
    {
      "number": 140,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 141,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s2"
    },
    {
      "number": 142,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s2"
    },
    {
      "number": 143,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s5"
    },
    {
      "number": 144,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 145,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s7"
    },
    {
      "number": 146,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s5"
    },
    {
      "number": 147,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 148,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s4"
    },
    {
      "number": 149,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s1"
    },
    {
      "number": 150,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s2"
    },
    {
      "number": 151,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 152,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s2"
    },
    {
      "number": 153,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 154,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s5"
    },
    {
      "number": 155,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s7"
    },
    {
      "number": 156,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s6"
    },
    {
      "number": 157,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s2"
    },
    {
      "number": 158,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 159,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s7"
    },
    {
      "number": 160,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s2"
    },
    {
      "number": 161,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 162,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s6"
    },
    {
      "number": 163,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s7"
    },
    {
      "number": 164,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s10"
    },
    {
      "number": 165,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s11"
    },
    {
      "number": 166,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s13"
    },
    {
      "number": 167,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s14"
    },
    {
      "number": 168,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s13"
    },
    {
      "number": 169,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s12"
    },
    {
      "number": 170,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s3"
    },
    {
      "number": 171,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s7"
    },
    {
      "number": 172,
      "chapterId": "ch5",
      "sourceSectionId": "ch5-s1"
    },
    {
      "number": 173,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 174,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 175,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s4"
    },
    {
      "number": 176,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 177,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s6"
    },
    {
      "number": 178,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s7"
    },
    {
      "number": 179,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s8"
    },
    {
      "number": 180,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 181,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s4"
    },
    {
      "number": 182,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s6"
    },
    {
      "number": 183,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 184,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s7"
    },
    {
      "number": 185,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 186,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s4"
    },
    {
      "number": 187,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s1"
    },
    {
      "number": 188,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s2"
    },
    {
      "number": 189,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 190,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 191,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s8"
    },
    {
      "number": 192,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s1"
    },
    {
      "number": 193,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 194,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s3"
    },
    {
      "number": 195,
      "chapterId": "ch6",
      "sourceSectionId": "ch6-s4"
    },
    {
      "number": 196,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s1"
    },
    {
      "number": 197,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s18"
    },
    {
      "number": 198,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s1"
    },
    {
      "number": 199,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s2"
    },
    {
      "number": 200,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s4"
    },
    {
      "number": 201,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s5"
    },
    {
      "number": 202,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s8"
    },
    {
      "number": 203,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s10"
    },
    {
      "number": 204,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s12"
    },
    {
      "number": 205,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s3"
    },
    {
      "number": 206,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s6"
    },
    {
      "number": 207,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s3"
    },
    {
      "number": 208,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s7"
    },
    {
      "number": 209,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s9"
    },
    {
      "number": 210,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s8"
    },
    {
      "number": 211,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s5"
    },
    {
      "number": 212,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s10"
    },
    {
      "number": 213,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s9"
    },
    {
      "number": 214,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s7"
    },
    {
      "number": 215,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s13"
    },
    {
      "number": 216,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s11"
    },
    {
      "number": 217,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s14"
    },
    {
      "number": 218,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s15"
    },
    {
      "number": 219,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s1"
    },
    {
      "number": 220,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s18"
    },
    {
      "number": 221,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s3"
    },
    {
      "number": 222,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s7"
    },
    {
      "number": 223,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s8"
    },
    {
      "number": 224,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s9"
    },
    {
      "number": 225,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s16"
    },
    {
      "number": 226,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s17"
    },
    {
      "number": 227,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s9"
    },
    {
      "number": 228,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s11"
    },
    {
      "number": 229,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s4"
    },
    {
      "number": 230,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s2"
    },
    {
      "number": 231,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s18"
    },
    {
      "number": 232,
      "chapterId": "ch7",
      "sourceSectionId": "ch7-s18"
    },
    {
      "number": 233,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s1"
    },
    {
      "number": 234,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s2"
    },
    {
      "number": 235,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s1"
    },
    {
      "number": 236,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s2"
    },
    {
      "number": 237,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s5"
    },
    {
      "number": 238,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s6"
    },
    {
      "number": 239,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s7"
    },
    {
      "number": 240,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s8"
    },
    {
      "number": 241,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s1"
    },
    {
      "number": 242,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s9"
    },
    {
      "number": 243,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s10"
    },
    {
      "number": 244,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s11"
    },
    {
      "number": 245,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s12"
    },
    {
      "number": 246,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s3"
    },
    {
      "number": 247,
      "chapterId": "ch8",
      "sourceSectionId": "ch8-s4"
    },
    {
      "number": 248,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 249,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s2"
    },
    {
      "number": 250,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s3"
    },
    {
      "number": 251,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s5"
    },
    {
      "number": 252,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 253,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 254,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s3"
    },
    {
      "number": 255,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s5"
    },
    {
      "number": 256,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s7"
    },
    {
      "number": 257,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s8"
    },
    {
      "number": 258,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s10"
    },
    {
      "number": 259,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s2"
    },
    {
      "number": 260,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s9"
    },
    {
      "number": 261,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s9"
    },
    {
      "number": 262,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s2"
    },
    {
      "number": 263,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 264,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s3"
    },
    {
      "number": 265,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 266,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s5"
    },
    {
      "number": 267,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s7"
    },
    {
      "number": 268,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 269,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s8"
    },
    {
      "number": 270,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 271,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s7"
    },
    {
      "number": 272,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 273,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s6"
    },
    {
      "number": 274,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s2"
    },
    {
      "number": 275,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s3"
    },
    {
      "number": 276,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s4"
    },
    {
      "number": 277,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s5"
    },
    {
      "number": 278,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s6"
    },
    {
      "number": 279,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s4"
    },
    {
      "number": 280,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s9"
    },
    {
      "number": 281,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s7"
    },
    {
      "number": 282,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 283,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 284,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 285,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 286,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 287,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s7"
    },
    {
      "number": 288,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s8"
    },
    {
      "number": 289,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s1"
    },
    {
      "number": 290,
      "chapterId": "ch9",
      "sourceSectionId": "ch9-s5"
    },
    {
      "number": 291,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s2"
    },
    {
      "number": 292,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s1"
    },
    {
      "number": 293,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s3"
    },
    {
      "number": 294,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s4"
    },
    {
      "number": 295,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s6"
    },
    {
      "number": 296,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s5"
    },
    {
      "number": 297,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s7"
    },
    {
      "number": 298,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s8"
    },
    {
      "number": 299,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s9"
    },
    {
      "number": 300,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s10"
    },
    {
      "number": 301,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s11"
    },
    {
      "number": 302,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s12"
    },
    {
      "number": 303,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s4"
    },
    {
      "number": 304,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s8"
    },
    {
      "number": 305,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s7"
    },
    {
      "number": 306,
      "chapterId": "ch10",
      "sourceSectionId": "ch10-s6"
    },
    {
      "number": 307,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s2"
    },
    {
      "number": 308,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s4"
    },
    {
      "number": 309,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s1"
    },
    {
      "number": 310,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s3"
    },
    {
      "number": 311,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s4"
    },
    {
      "number": 312,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s3"
    },
    {
      "number": 313,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s3"
    },
    {
      "number": 314,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s4"
    },
    {
      "number": 315,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s2"
    },
    {
      "number": 316,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s4"
    },
    {
      "number": 317,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s3"
    },
    {
      "number": 318,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s3"
    },
    {
      "number": 319,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s5"
    },
    {
      "number": 320,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s6"
    },
    {
      "number": 321,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s6"
    },
    {
      "number": 322,
      "chapterId": "ch11",
      "sourceSectionId": "ch11-s7"
    },
    {
      "number": 323,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s2"
    },
    {
      "number": 324,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s3"
    },
    {
      "number": 325,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s5"
    },
    {
      "number": 326,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s6"
    },
    {
      "number": 327,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s1"
    },
    {
      "number": 328,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s2"
    },
    {
      "number": 329,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s4"
    },
    {
      "number": 330,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s5"
    },
    {
      "number": 331,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s3"
    },
    {
      "number": 332,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s4"
    },
    {
      "number": 333,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s5"
    },
    {
      "number": 334,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s7"
    },
    {
      "number": 335,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s7"
    },
    {
      "number": 336,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s7"
    },
    {
      "number": 337,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s4"
    },
    {
      "number": 338,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s4"
    },
    {
      "number": 339,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s9"
    },
    {
      "number": 340,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s4"
    },
    {
      "number": 341,
      "chapterId": "ch12",
      "sourceSectionId": "ch12-s8"
    }
  ]
};
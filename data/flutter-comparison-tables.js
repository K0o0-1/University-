/* Supplementary comparison tables transcribed from user-supplied Flutter HTML. */
globalThis.FLUTTER_COMPARISON_TABLES = Object.freeze({
  "ch1:Variables & Constants": [
    {
      "headers": [
        "المعيار",
        "var",
        "dynamic"
      ],
      "rows": [
        [
          "تحديد النوع",
          "عند التعيين",
          "أثناء التشغيل"
        ],
        [
          "تغيير النوع",
          "لا يتغير",
          "يمكن تغييره"
        ]
      ]
    },
    {
      "headers": [
        "المعيار",
        "final",
        "const"
      ],
      "rows": [
        [
          "وقت تحديد القيمة",
          "وقت التشغيل",
          "وقت الترجمة (compile-time)"
        ]
      ]
    }
  ],
  "ch2:extends vs implements": [
    {
      "headers": [
        "المعيار",
        "extends",
        "implements"
      ],
      "rows": [
        [
          "الغرض",
          "وراثة Class",
          "تطبيق واجهة / عقد Class"
        ],
        [
          "الوراثة",
          "يرث الخصائص والدوال",
          "يلتزم بتطبيق الواجهة"
        ]
      ]
    }
  ],
  "ch5:StatelessWidget vs StatefulWidget": [
    {
      "headers": [
        "المعيار",
        "StatelessWidget",
        "StatefulWidget"
      ],
      "rows": [
        [
          "الحالة",
          "ثابتة لا تتغير",
          "قابلة للتغيير أثناء التشغيل"
        ],
        [
          "setState()",
          "لا يمكن استخدامها",
          "يمكن استخدامها"
        ],
        [
          "الاستخدام",
          "واجهة ثابتة",
          "واجهة تعتمد على بيانات متغيرة"
        ],
        [
          "مثال",
          "نص ثابت \"Welcome\"",
          "عداد يتغير بزر"
        ]
      ]
    }
  ],
  "ch7:Padding vs Margin": [
    {
      "headers": [
        "المعيار",
        "Padding",
        "Margin"
      ],
      "rows": [
        [
          "نوع المسافة",
          "داخلية (داخل حدود العنصر)",
          "خارجية"
        ],
        [
          "التنفيذ",
          "خاصية padding / Padding widget",
          "Container.margin"
        ]
      ]
    }
  ],
  "ch7:child و children": [
    {
      "headers": [
        "المعيار",
        "child",
        "children"
      ],
      "rows": [
        [
          "العدد",
          "Widget واحدة",
          "عدة Widgets"
        ],
        [
          "الاستخدام",
          "Widgets مفردة",
          "Row, Column, Stack..."
        ]
      ]
    }
  ],
  "ch9:IconButton": [
    {
      "headers": [
        "المعيار",
        "Icon",
        "IconButton"
      ],
      "rows": [
        [
          "الوظيفة",
          "عرض أيقونة فقط",
          "عرض أيقونة قابلة للضغط"
        ],
        [
          "التفاعل",
          "غير قابلة للضغط",
          "قابلة للضغط"
        ]
      ]
    }
  ],
  "ch11:Primary Key vs Foreign Key": [
    {
      "headers": [
        "المعيار",
        "Primary Key",
        "Foreign Key"
      ],
      "rows": [
        [
          "الوظيفة",
          "يميز السجل داخل جدوله",
          "يربط سجلًا بجدول آخر"
        ]
      ]
    }
  ],
  "ch11:SQL vs NoSQL": [
    {
      "headers": [
        "المعيار",
        "SQL",
        "NoSQL"
      ],
      "rows": [
        [
          "البنية",
          "جداول وعلاقات",
          "نماذج مرنة مثل Documents"
        ],
        [
          "النوع",
          "علائقية",
          "غير علائقية"
        ]
      ]
    }
  ],
  "ch12:SQLite vs Firestore": [
    {
      "headers": [
        "المعيار",
        "SQLite",
        "Firestore"
      ],
      "rows": [
        [
          "الموقع",
          "محلية",
          "سحابية"
        ],
        [
          "النوع",
          "علائقية (SQL)",
          "NoSQL"
        ]
      ]
    }
  ]
});
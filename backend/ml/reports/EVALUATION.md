# Model comparison

Generated: 2026-09-04T11:38:56Z  |  dataset: **real**

2258 samples, split `group-by-session` (1115 train / 1143 test).

| model | accuracy | precision | recall | F1 (macro) |
|---|---|---|---|---|
| rule_based | 0.7008 | 0.8023 | 0.6972 | 0.636 |
| most_frequent | 0.1557 | 0.026 | 0.1667 | 0.0449 |
| logreg | 0.9545 | 0.9549 | 0.9538 | 0.9541 |
| random_forest | 0.8425 | 0.8909 | 0.8556 | 0.8306 |
| svm_rbf | 0.9081 | 0.9156 | 0.9123 | 0.9081 |

**Selected model: `logreg`**

## Confusion matrix (selected model)

```
true\pred  open_p   fist thumbs victor pointi ok_sig
open_palm     199      1      0      0      0     13
fist            0    195      2      4      0      2
thumbs_up       0      0    200      0      0      0
victory         0      1      0    177      0      0
pointing_u      0      8      4      1    165      0
ok_sign        14      0      0      1      1    155
```

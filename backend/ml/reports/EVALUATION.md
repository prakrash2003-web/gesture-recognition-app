# Model comparison

Generated: 2026-09-04T08:14:24Z  |  dataset: **synthetic**  |  **PROVISIONAL (synthetic)**

7200 samples, split `group-by-session` (4800 train / 2400 test).

| model | accuracy | precision | recall | F1 (macro) |
|---|---|---|---|---|
| rule_based | 0.9354 | 0.9594 | 0.9354 | 0.9415 |
| most_frequent | 0.1667 | 0.0278 | 0.1667 | 0.0476 |
| logreg | 0.9996 | 0.9996 | 0.9996 | 0.9996 |
| random_forest | 0.9992 | 0.9992 | 0.9992 | 0.9992 |
| svm_rbf | 0.9992 | 0.9992 | 0.9992 | 0.9992 |

**Selected model: `logreg`**

## Confusion matrix (selected model)

```
true\pred  open_p   fist thumbs victor pointi ok_sig
open_palm     400      0      0      0      0      0
fist            0    400      0      0      0      0
thumbs_up       0      1    399      0      0      0
victory         0      0      0    400      0      0
pointing_u      0      0      0      0    400      0
ok_sign         0      0      0      0      0    400
```

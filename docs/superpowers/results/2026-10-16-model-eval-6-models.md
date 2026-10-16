# Model A/B Accuracy Report

_Generated 2026-10-16T20:49:04.967Z_

## Summary

| model                 | overall(exist) | overall(strict) | verified(exist) | verified(strict) | corrected | hallucinated | fix✓(approx) | unknown | false-acc | misses | avg-lat | tokens |
|-----------------------|----------------|-----------------|-----------------|------------------|-----------|--------------|--------------|---------|-----------|--------|---------|--------|
| gemini-3.5-flash      | 93.3%          | 80.0%           | 95.0%           | 55.0%            | 85.0%     | 100.0%       | 100.0%       | 0       | 1         | 0      | 9196ms  | 122736 |
| gemini-3.6-flash      | 91.7%          | 76.7%           | 95.0%           | 50.0%            | 80.0%     | 100.0%       | 100.0%       | 0       | 1         | 0      | 9652ms  | 130232 |
| gemini-3.7-flash      | 93.3%          | 75.0%           | 95.0%           | 40.0%            | 85.0%     | 100.0%       | 100.0%       | 1       | 0         | 0      | 34083ms | 164294 |
| gemini-3.8-flash      | 91.7%          | 75.0%           | 95.0%           | 45.0%            | 80.0%     | 100.0%       | 100.0%       | 2       | 0         | 0      | 36908ms | 148034 |
| gemini-4-argon        | 95.0%          | 83.3%           | 100.0%          | 65.0%            | 85.0%     | 100.0%       | 100.0%       | 0       | 0         | 0      | 42616ms | 78439  |
| gemini-3.5-flash-lite | 81.7%          | 76.7%           | 95.0%           | 80.0%            | 50.0%     | 100.0%       | 100.0%       | 0       | 1         | 0      | 3263ms  | 38339  |

## gemini-3.5-flash

- Overall accuracy (strict): **80.0%** (48/60)
- Existence recognition (verified or corrected on real sources): **93.3%** (56/60)
- False accusations (real → flagged fake): **1**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 17/17
- Unknown/failed verdicts: 0

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 11       | 8         | 1            | 0       |
| corrected         | 2        | 17        | 1            | 0       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (12)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝, 慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - notes: The reference exists, but the author's name was incomplete; it has been corrected from 郝, 慧 to 郝, 慧敏.
- **v4** truth=`verified` predicted=`hallucinated`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: This reference could not be verified. The DOI (10.1007/bf02201120) is invalid, and no publication matching these authors, title, and page range in De Economist (1935, Vol. 84) exists.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: Removed 'No ' from the volume designation to follow APA 7th format (*26*(2) instead of *No 26*(2)).
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: The author names were capitalized in full uppercase. In APA 7th Edition, author names should use title case (e.g., Morris, A. instead of MORRIS, A.).
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - notes: Removed the unnecessary period following the question mark at the end of the article title.
- **v14** truth=`verified` predicted=`corrected`
  - ref: Hammond, N. (1976). C. Bruce Hunter: A guide to ancient Maya ruins. Norman: University of Oklahoma Press, 1975. Agents: Bailey & Swinfen, Folkestone, Kent. 349 pp., 23 pls. (in colour), 132 figs., 18 maps and site plans. $4.95, £3.50 (paperback). *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - model correction: Hammond, N. (1976). [Review of the book *A guide to ancient Maya ruins*, by C. B. Hunter]. *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/S0003598X00070733
  - notes: The source is a book review published in Antiquity. In APA 7th Edition, book reviews without a distinct article title are formatted with a bracketed description of the reviewed work rather than including the full publisher header, page counts, or prices. The book title inside the review bracket is italicized in sentence case.
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: Corrected author name spacing and typos (removed extra punctuation), and adjusted journal title from ALL CAPS to sentence case per APA standards.
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: Almeida, L. H. C., Nadur, M. A., Almeida, P. P. S., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: Corrected journal title from ALL CAPS to title case according to APA 7th Edition rules, and removed the particle 'de' (represented as 'D.') from the author initials.
- **v19** truth=`verified` predicted=`corrected`
  - ref: García de la Cuerda, A. (2012). «En camino hacia una meta santa: ser prolongadores de la misión». *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - model correction: García de la Cuerda, A. (2012). En camino hacia una meta santa: Ser prolongadores de la misión: A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud. *Seminarios Sobre los Ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - notes: The citation was corrected according to APA 7th Edition rules: removed guillemets (« ») surrounding the article title, capitalized the first letter following colons in the title/subtitle, completed the full article title, and applied title case to the journal name.
- **c1** truth=`corrected` predicted=`verified`
  - ref: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen Aspergillus fumigatus. Molecular Immunology, 102, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - model correction: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen *Aspergillus fumigatus*. *Molecular Immunology*, *102*, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - notes: The reference exists as a published conference abstract in Molecular Immunology and is correctly formatted according to APA 7th Edition rules.
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: This reference is a combination of two distinct articles published in 1997 in the Journal of the Illuminating Engineering Institute of Japan, Vol. 81 (Appendix): 'Fluorescent lamps for preservation of good environment' by K. Nishimura and K. Ookita (p. 302, DOI: 10.2150/jieij1980.81.appendix_302) and 'Environmental aspects of incandescent lamps' by T. Takemura (p. 303, DOI: 10.2150/jieij1980.81.appendix_303). No single co-authored article with this title exists.
- **c16** truth=`corrected` predicted=`verified`
  - ref: Klügl, F. (2006). Multiagentensimulation. Informatik-Spektrum, 29(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - model correction: Klügl, F. (2006). Multiagentensimulation. *Informatik-Spektrum*, *29*(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - notes: The reference is authentic and correctly formatted according to APA 7th edition guidelines.

## gemini-3.6-flash

- Overall accuracy (strict): **76.7%** (46/60)
- Existence recognition (verified or corrected on real sources): **91.7%** (55/60)
- False accusations (real → flagged fake): **1**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 16/16
- Unknown/failed verdicts: 0

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 10       | 9         | 1            | 0       |
| corrected         | 3        | 16        | 1            | 0       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (14)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝, 慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - notes: The author's full name is 郝慧敏 (Hao, Huimin), not 郝慧.
- **v4** truth=`verified` predicted=`hallucinated`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: This reference appears to be hallucinated. The DOI (10.1007/bf02201120) does not exist, 'Th. L.' is an incomplete author name fragment, and 'Boekbespreking' is the generic Dutch term for 'Book review' rather than a distinct article title in De Economist (1935).
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: Removed 'No ' from the volume number, as APA 7th edition formatting requires the volume number alone (italicized) without designations like 'No.' or 'Vol.'
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: The citation was corrected to fix author names from all-uppercase to standard title case capitalization in accordance with APA 7th edition guidelines.
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - notes: Removed the unnecessary period after the question mark at the end of the article title.
- **v13** truth=`verified` predicted=`corrected`
  - ref: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*, A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - model correction: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*(Suppl 3), A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - notes: Added the supplement indicator '(Suppl 3)' to the issue position per APA 7th Edition rules for journal supplement issues.
- **v14** truth=`verified` predicted=`corrected`
  - ref: Hammond, N. (1976). C. Bruce Hunter: A guide to ancient Maya ruins. Norman: University of Oklahoma Press, 1975. Agents: Bailey & Swinfen, Folkestone, Kent. 349 pp., 23 pls. (in colour), 132 figs., 18 maps and site plans. $4.95, £3.50 (paperback). *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - model correction: Hammond, N. (1976). [Review of the book *A guide to ancient Maya ruins*, by C. B. Hunter]. *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/S0003598X00070733
  - notes: Formatted according to APA 7th Edition rules for book reviews in journal articles. Removed publisher details, physical descriptions, and price information from the title field, and replaced them with the bracketed review notation.
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: The reference exists. Fixed punctuation/formatting errors in author names ('Е. А. ,.,' to 'Е. А.,' and 'Устинова ., Н. С.' to 'Устинова, Н. С.') and converted the journal title from all-caps to standard capitalization ('Тенденции развития науки и образования').
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: Almeida, L. H. C. de, Nadur, M. A., Almeida, P. P. S. de, Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. de F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: The journal title was capitalized in all uppercase letters rather than Title Case, and the Portuguese preposition 'de' in the authors' names should be rendered in lowercase rather than abbreviated as an initial 'D.'
- **v19** truth=`verified` predicted=`corrected`
  - ref: García de la Cuerda, A. (2012). «En camino hacia una meta santa: ser prolongadores de la misión». *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - model correction: García de la Cuerda, A. (2012). En camino hacia una meta santa: Ser prolongadores de la misión: A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la JMJ. *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - notes: In APA 7th edition, article titles should not be enclosed in quotation marks or guillemets (« »), and the full title including the subtitle should be provided in sentence case.
- **c1** truth=`corrected` predicted=`verified`
  - ref: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen Aspergillus fumigatus. Molecular Immunology, 102, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - model correction: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen *Aspergillus fumigatus*. *Molecular Immunology*, *102*, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - notes: The reference was verified as a published meeting abstract from the 27th International Complement Workshop in Molecular Immunology (Volume 102, 2018, pages 204–205). All formatting elements, including sentence-case title, author list, volume, page range with en dash, and DOI, are correct according to APA 7th edition rules.
- **c6** truth=`corrected` predicted=`verified`
  - ref: Squire, R. H. (1988). Reply to comment on "Cooper pairs and their role in aromaticity". The Journal of Physical Chemistry, 92(6), 1701–1702. https://doi.org/10.1021/j100317a063
  - model correction: Squire, R. H. (1988). Reply to comment on "Cooper pairs and their role in aromaticity". *The Journal of Physical Chemistry*, *92*(6), 1701–1702. https://doi.org/10.1021/j100317a063
  - notes: The reference was verified as an existing article in The Journal of Physical Chemistry and is correctly formatted according to APA 7th Edition rules.
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: This paper does not exist as cited. It appears to be a hallucinated blend of separate conference abstracts published in 1997 (Volume 81, Appendix issue) of the Journal of the Illuminating Engineering Institute of Japan, specifically combining 'Fluorescent Lamps for Preservation of Good Enviroment' by K. Nishimura and K. Ookita (p. 302) with 'Environmental Aspects of Incandescent Lamps' by T. Takemura (p. 303).
- **c16** truth=`corrected` predicted=`verified`
  - ref: Klügl, F. (2006). Multiagentensimulation. Informatik-Spektrum, 29(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - model correction: Klügl, F. (2006). Multiagentensimulation. *Informatik-Spektrum*, *29*(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - notes: The reference is verified and correctly formatted according to APA 7th edition guidelines.

## gemini-3.7-flash

- Overall accuracy (strict): **75.0%** (45/60)
- Existence recognition (verified or corrected on real sources): **93.3%** (56/60)
- False accusations (real → flagged fake): **0**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 17/17
- Unknown/failed verdicts: 1

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 8        | 11        | 0            | 1       |
| corrected         | 2        | 17        | 1            | 0       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (15)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝, 慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177–178. https://doi.org/10.26549/fm.v1i2.353
  - notes: Corrected the author's name from '郝, 慧' to '郝, 慧敏' (Huimin Hao) and updated the page range from 177 to 177–178.
- **v4** truth=`verified` predicted=`unknown`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: The AI returned an unreadable response after multiple attempts. Please try again.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: In APA 7th Edition, do not include 'No' or 'Vol.' before the volume number; the volume number should appear directly before the issue number in parentheses without extra text.
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: The citation is valid, but the authors' surnames were capitalized in all-caps instead of standard title/sentence case as required by APA 7th edition.
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - notes: Removed the unnecessary period following the question mark at the end of the article title (per APA 7th edition, a question mark takes the place of the terminal period).
- **v13** truth=`verified` predicted=`corrected`
  - ref: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*, A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - model correction: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer [Abstract]. *International Journal of Gynecological Cancer*, *31*(Suppl. 3), A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - notes: The reference is authentic but requires APA 7th formatting adjustments: the abstract number '65' was removed from the title, the supplement issue designation '(Suppl. 3)' was added after the volume number, and the '[Abstract]' bracketed description was added to indicate that this is a conference abstract published in a journal supplement.
- **v14** truth=`verified` predicted=`corrected`
  - ref: Hammond, N. (1976). C. Bruce Hunter: A guide to ancient Maya ruins. Norman: University of Oklahoma Press, 1975. Agents: Bailey & Swinfen, Folkestone, Kent. 349 pp., 23 pls. (in colour), 132 figs., 18 maps and site plans. $4.95, £3.50 (paperback). *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - model correction: Hammond, N. (1976). [Review of the book *A guide to ancient Maya ruins*, by C. B. Hunter]. *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - notes: The source is a book review by Norman Hammond published in Antiquity in 1976. The citation incorrectly included raw bibliographic metadata of the reviewed book (publisher, distributor, book pagination, illustrations, and price) in place of the title. Under APA 7th Edition rules for untitled book reviews (Section 10.7), this should be formatted using the bracketed description '[Review of the book *A guide to ancient Maya ruins*, by C. B. Hunter]'.
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: The source exists. Corrected erroneous punctuation and spacing in the author names ('Е. А. ,.,' and 'Устинова ., Н. С.') and changed the all-caps journal title to proper sentence/title capitalization for Russian periodicals.
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: Almeida, L. H. C. de, Nadur, M. A., Almeida, P. P. S. de, Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. de F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), Article e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: The source exists and was published in 2025. Several formatting corrections were made: (1) The journal title should be in title case (*Observatório de la Economía Latinoamericana*) rather than all caps; (2) The Portuguese preposition 'de' was erroneously abbreviated as a capitalized initial ('D.'); (3) Under APA 7th Edition rules, an article number (e-locator) should be preceded by the word 'Article' (Article e9033).
- **v17** truth=`verified` predicted=`corrected`
  - ref: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - model correction: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, Article 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - notes: The reference is authentic. In APA 7th Edition, when a journal article has an article number (eLocator) rather than a page range, the word 'Article' should precede the article number (e.g., 'Article 109658').
- **v18** truth=`verified` predicted=`corrected`
  - ref: Fesenko, E., Pavlov, Y., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wallof mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - model correction: Fesenko, E., Pavlov, Y., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wall of mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - notes: The reference is authentic, but contains a typographical error in the article title where a space was missing between 'wall' and 'of' ('foot wallof' corrected to 'foot wall of').
- **v19** truth=`verified` predicted=`corrected`
  - ref: García de la Cuerda, A. (2012). «En camino hacia una meta santa: ser prolongadores de la misión». *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - model correction: García de la Cuerda, A. (2012). "En camino hacia una meta santa: ser prolongadores de la misión": A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud. *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - notes: The citation exists, but the article title was incomplete and improperly enclosed in guillemets (« »). In APA 7th edition, article titles are not enclosed in quotation marks (quotations within the title use standard double quotation marks), and the full subtitle ('A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud') should be included.
- **c1** truth=`corrected` predicted=`verified`
  - ref: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen Aspergillus fumigatus. Molecular Immunology, 102, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - model correction: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen *Aspergillus fumigatus*. *Molecular Immunology*, *102*, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - notes: The reference is verified. This work was published as a conference abstract from the 27th International Complement Workshop in Molecular Immunology.
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: This reference does not exist. It is a hallucination that merges two separate articles published consecutively in the September 1997 issue of the Journal of the Illuminating Engineering Institute of Japan (Vol. 81, No. 9): "Environmental Aspects of Incandescent Lamps" by Tetsu Takemura (pp. 831–833, https://doi.org/10.2150/jieij1980.81.9_831) and "Fluorescent Lamps for Preservation of Good Environment" by Keiichi Nishimura and Kouji Ookita (pp. 834–839, https://doi.org/10.2150/jieij1980.81.9_834). The cited DOI does not exist.
- **c16** truth=`corrected` predicted=`verified`
  - ref: Klügl, F. (2006). Multiagentensimulation. Informatik-Spektrum, 29(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - model correction: Klügl, F. (2006). Multiagentensimulation. *Informatik-Spektrum*, *29*(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - notes: The reference is authentic and properly formatted according to APA 7th edition standards.

## gemini-3.8-flash

- Overall accuracy (strict): **75.0%** (45/60)
- Existence recognition (verified or corrected on real sources): **91.7%** (55/60)
- False accusations (real → flagged fake): **0**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 16/16
- Unknown/failed verdicts: 2

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 9        | 10        | 0            | 1       |
| corrected         | 2        | 16        | 1            | 1       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (15)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝, 慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177–178. https://doi.org/10.26549/fm.v1i2.353
  - notes: The author's name is 郝慧敏 (Huimin Hao), not 郝慧, and the article spans pages 177–178.
- **v4** truth=`verified` predicted=`unknown`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: The AI returned an unreadable response after multiple attempts. Please try again.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: In APA 7th edition, volume numbers are presented without 'No', 'No.', or 'Vol.'. The volume number should simply be italicized, followed by the issue number in parentheses without italics (e.g., *26*(2)).
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: The citation is valid, but the author names were provided in all-caps. Under APA 7th edition style, author names should be formatted in standard title case (e.g., 'Morris, A.').
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - notes: The paper exists. In APA 7th edition, when a title ends with a question mark, no period should follow it.
- **v13** truth=`verified` predicted=`corrected`
  - ref: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*, A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - model correction: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer [Abstract]. *International Journal of Gynecological Cancer*, *31*(Suppl. 3), A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - notes: The source exists as a conference abstract from the 22nd European Congress on Gynaecological Oncology (ESGO 2021) published in a journal supplement. In APA 7th edition, the abstract presentation number ('65') should be removed from the article title, a bracketed description '[Abstract]' should follow the title, and the supplement designation '(Suppl. 3)' must be included following the volume number.
- **v14** truth=`verified` predicted=`corrected`
  - ref: Hammond, N. (1976). C. Bruce Hunter: A guide to ancient Maya ruins. Norman: University of Oklahoma Press, 1975. Agents: Bailey & Swinfen, Folkestone, Kent. 349 pp., 23 pls. (in colour), 132 figs., 18 maps and site plans. $4.95, £3.50 (paperback). *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - model correction: Hammond, N. (1976). [Review of the book *A guide to ancient Maya ruins*, by C. B. Hunter]. *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - notes: The reference is an untitled book review published in Antiquity (Vol. 50, Issue 197). The provided reference included raw bibliographic header metadata (publisher details, distributor, pagination, illustrations, and price) as the article title. According to APA 7th edition (Section 10.7), an untitled book review should use a bracketed description in place of the title: [Review of the book *Title*, by Author].
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: Fixed erratic punctuation and spacing in the author names ('Е. А. ,.,' to 'Е. А.,' and 'Устинова ., Н. С.' to 'Устинова, Н. С.'), and changed the journal title from all-caps to standard title case.
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: Almeida, L. H. C. de, Nadur, M. A., Almeida, P. P. S. de, Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. de F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), Article e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: The citation refers to a real article published in 2025. It has been corrected for APA 7th edition style: (1) the journal title must be in title case rather than all-caps (*Observatório de la Economía Latinoamericana*); (2) the Portuguese preposition 'de' was erroneously abbreviated as a given-name initial 'D.' for multiple authors; and (3) APA 7 requires the word 'Article' before an e-locator/article number.
- **v18** truth=`verified` predicted=`corrected`
  - ref: Fesenko, E., Pavlov, Y., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wallof mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - model correction: Fesenko, E., Pavlov, Ye., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wall of mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - notes: The reference is authentic. Two corrections were made: a space was added to fix the typo 'wallof' ('wall of') in the article title, and the second author's first initial was updated from 'Y.' to 'Ye.' (Yevhen) as transliterated in the journal's publication metadata.
- **v19** truth=`verified` predicted=`corrected`
  - ref: García de la Cuerda, A. (2012). «En camino hacia una meta santa: ser prolongadores de la misión». *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - model correction: García de la Cuerda, A. (2012). “En camino hacia una meta santa: Ser prolongadores de la misión”: A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud. *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - notes: The reference exists, but the article title was incomplete (omitting the subtitle) and should not be enclosed in guillemets/angle quotes (« ») as a whole. In APA 7th style, the full title with its subtitle should be provided, and double quotation marks should only surround the quoted phrase within the title.
- **c1** truth=`corrected` predicted=`unknown`
  - ref: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen Aspergillus fumigatus. Molecular Immunology, 102, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - notes: The AI returned an unreadable response after multiple attempts. Please try again.
- **c6** truth=`corrected` predicted=`verified`
  - ref: Squire, R. H. (1988). Reply to comment on "Cooper pairs and their role in aromaticity". The Journal of Physical Chemistry, 92(6), 1701–1702. https://doi.org/10.1021/j100317a063
  - model correction: Squire, R. H. (1988). Reply to comment on "Cooper pairs and their role in aromaticity". *The Journal of Physical Chemistry*, *92*(6), 1701–1702. https://doi.org/10.1021/j100317a063
  - notes: The reference is accurate and correctly formatted according to APA 7th edition rules.
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: This reference is hallucinated. It appears to be an artificial merger of two separate articles published in Vol. 81, Issue 9 (1997) of the Journal of the Illuminating Engineering Institute of Japan: "Environmental Aspects of Incandescent Lamps" by Tetsu Takemura (pp. 831–833) and "Fluorescent Lamps for Preservation of Good Enviroment" by Keiichi Nishimura and Kouji Ookita (pp. 834–839). No article with the combined title, author list, or DOI exists.
- **c16** truth=`corrected` predicted=`verified`
  - ref: Klügl, F. (2006). Multiagentensimulation. Informatik-Spektrum, 29(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - model correction: Klügl, F. (2006). Multiagentensimulation. *Informatik-Spektrum*, *29*(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - notes: The reference is accurate and correctly formatted according to APA 7th Edition style.

## gemini-4-argon

- Overall accuracy (strict): **83.3%** (50/60)
- Existence recognition (verified or corrected on real sources): **95.0%** (57/60)
- False accusations (real → flagged fake): **0**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 17/17
- Unknown/failed verdicts: 0

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 13       | 7         | 0            | 0       |
| corrected         | 2        | 17        | 1            | 0       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (10)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - notes: The author's full name is 郝慧敏 (Hao Huimin), which was truncated to 郝, 慧 in the input. In Chinese APA references, Chinese names are typically written in full without a comma or initial truncation (郝慧敏), or if following the surname-comma-given-name format used in the prompt, the full given name should be included (郝, 慧敏).
- **v4** truth=`verified` predicted=`corrected`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - model correction: L., Th., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: The source exists in De Economist (1935, Vol. 84, Issue 1, pp. 841–848) immediately preceding 'Ontvangen boeken' (pp. 848–852, DOI: 10.1007/BF02201121), with authors 'Th. L.' (the initials of recurring contributor Th. Ligthart) and J. M. E. M. A. Zonnenberg. In Springer/CrossRef metadata, 'Th. L.' is parsed with 'L.' as the surname and 'Th.' as the given name initial; per APA 7th Edition rules for inverted author names, this should be formatted as 'L., Th.,' rather than 'Th. L.,'.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: In APA 7th edition, the volume number should be written simply as a numeral (*26*) without prefixes like 'No' or 'Vol.'.
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: The article exists and the metadata (year, title, journal, volume, issue, pages, and DOI) is accurate. However, the authors' surnames were written in all capital letters; in APA 7th Edition, author surnames must be in standard title case (only the first letter capitalized, rather than all caps).
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - notes: Removed the extraneous period after the question mark at the end of the article title (in APA 7th edition, when a title ends with a question mark or exclamation point, a period is not added).
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: The article exists and was verified via its DOI. Corrected severe punctuation errors in the author names ('Терещенко, Е. А. ,., & Устинова ., Н. С.' to 'Терещенко, Е. А., & Устинова, Н. С.') and converted the journal title from ALL CAPS to standard capitalization.
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: Almeida, L. H. C. de, Nadur, M. A., Almeida, P. P. S. de, Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. de F. (2025). Cell protector, cobalt, and molybdenum in association with *Bradyrhizobium* and *Azospirillum* in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: In APA 7th edition, journal titles should be in title case rather than ALL CAPS, and scientific genus names (Bradyrhizobium and Azospirillum) in the article title should be italicized. Additionally, Portuguese name particles ('de') should not be abbreviated as middle initials ('D.'); per Portuguese naming conventions in APA style, particles are either placed after the initials or omitted.
- **c6** truth=`corrected` predicted=`verified`
  - ref: Squire, R. H. (1988). Reply to comment on "Cooper pairs and their role in aromaticity". The Journal of Physical Chemistry, 92(6), 1701–1702. https://doi.org/10.1021/j100317a063
  - model correction: Squire, R. H. (1988). Reply to comment on "Cooper pairs and their role in aromaticity". *The Journal of Physical Chemistry*, *92*(6), 1701–1702. https://doi.org/10.1021/j100317a063
  - notes: The reference exists in The Journal of Physical Chemistry and is accurately formatted according to APA 7th Edition guidelines.
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: This reference is a hallucinated mashup of two separate articles published in 1997 in the *Journal of the Illuminating Engineering Institute of Japan*, Volume 81, Issue 9: (1) 'Fluorescent Lamps for Preservation of Good Enviroment' by Keiichi Nishimura and Kouji Ookita (pp. 834–839, https://doi.org/10.2150/jieij1980.81.9_834) and (2) 'Environmental Aspects of Incandescent Lamps' by Tetsu Takemura (pp. 831–833, https://doi.org/10.2150/jieij1980.81.9_831). Furthermore, the year (1999 vs. 1997 for Vol. 81), issue/page numbers, and DOI in the provided citation are fabricated.
- **c16** truth=`corrected` predicted=`verified`
  - ref: Klügl, F. (2006). Multiagentensimulation. Informatik-Spektrum, 29(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - model correction: Klügl, F. (2006). Multiagentensimulation. *Informatik-Spektrum*, *29*(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - notes: The reference is accurate and properly formatted according to APA 7th Edition rules.

## gemini-3.5-flash-lite

- Overall accuracy (strict): **76.7%** (46/60)
- Existence recognition (verified or corrected on real sources): **81.7%** (49/60)
- False accusations (real → flagged fake): **1**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 10/10
- Unknown/failed verdicts: 0

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 16       | 3         | 1            | 0       |
| corrected         | 8        | 10        | 2            | 0       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (14)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝, 慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - notes: The author's name is actually 郝慧敏 (Huimin Hao), not 郝慧. The journal title and volume number are italicized, and the DOI URL is properly included following APA 7th edition guidelines.
- **v4** truth=`verified` predicted=`hallucinated`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: The specified journal article reference, authors (Th. L. & Zonnenberg, J. M. E. M. A.), and specific DOI (10.1007/bf02201120) do not exist or correspond to a real publication in De Economist for 1935.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: Fixed the journal volume and issue formatting to match standard APA 7th style for journals (Volume 26, Issue 2, denoted as 26(2) or 26(2)), and used an en dash for the page range.
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: Fixed typos and punctuation in author initials (removed stray commas, spaces, and periods like ',.,' and '.,'). Fixed journal title casing to standard sentence case or regular title format as required for the Russian journal title in APA 7th style (*Тенденции развития науки и образования*), while keeping italics on the journal title and volume number.
- **c1** truth=`corrected` predicted=`verified`
  - ref: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen Aspergillus fumigatus. Molecular Immunology, 102, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - model correction: Rosbjerg, A., Skjoedt, M., Würzner, R., & Garred, P. (2018). MASP-1 and MASP-3 as pathogen recognition molecules on the opportunistic fungal pathogen Aspergillus fumigatus. *Molecular Immunology*, *102*, 204–205. https://doi.org/10.1016/j.molimm.2018.06.193
  - notes: The reference exists and is correctly formatted according to APA 7th edition standards.
- **c2** truth=`corrected` predicted=`verified`
  - ref: Datta, S. (2000). Crystal structures of Mycobacterium tuberculosis RecA and its complex with ADP-AlF4: implications for decreased ATPase activity and molecular aggregation. *Nucleic Acids Research*, *35*(24), 4964–4973. https://doi.org/10.1093/nar/28.24.4964
  - model correction: Datta, S. (2000). Crystal structures of Mycobacterium tuberculosis RecA and its complex with ADP-AlF4: implications for decreased ATPase activity and molecular aggregation. *Nucleic Acids Research*, *28*(24), 4964–4973. https://doi.org/10.1093/nar/28.24.4964
  - notes: The reference exists and is properly formatted according to APA 7th edition.
- **c4** truth=`corrected` predicted=`verified`
  - ref: Hang, L., Lu, W., Ge, X., Ye, B., Zhao, Z., & Cheng, F. (2024). R&D innovation, industrial evolution and the labor skill structure in China manufacturing. *Technological Forecasting and Social Change*, *204*, 9999. https://doi.org/10.1016/j.techfore.2024.123434
  - model correction: Hang, L., Lu, W., Ge, X., Ye, B., Zhao, Z., & Cheng, F. (2024). R&D innovation, industrial evolution and the labor skill structure in China manufacturing. *Technological Forecasting and Social Change*, *204*, 123434. https://doi.org/10.1016/j.techfore.2024.123434
  - notes: The paper exists and is formatted correctly according to APA 7th edition.
- **c6** truth=`corrected` predicted=`verified`
  - ref: Squire, R. H. (1988). Reply to comment on "Cooper pairs and their role in aromaticity". The Journal of Physical Chemistry, 92(6), 1701–1702. https://doi.org/10.1021/j100317a063
  - model correction: Squire, R. H. (1988). Reply to comment on "Cooper pairs and their role in aromaticity". *The Journal of Physical Chemistry*, *92*(6), 1701–1702. https://doi.org/10.1021/j100317a063
  - notes: The reference exists, matches the published article details perfectly, and complies with APA 7th formatting requirements.
- **c7** truth=`corrected` predicted=`hallucinated`
  - ref: Lee, Y. (2016). Psychoanalytic core of the seven psychoanalyst. *Journal of Lacan & Contemporary Psychoanalysis*, *25*(1), 135. https://doi.org/10.18873/jlcp.2016.02.18.1.135
  - notes: The referenced paper does not exist with this specific citation text. While the author (Y. Lee) and the journal (now titled 'Journal of Contemporary Psychoanalysis') exist, the combination of title, volume, issue, page number, and DOI '10.18873/jlcp.2016.02.18.1.135' is a hallucination or incorrect fabrication.
- **c11** truth=`corrected` predicted=`verified`
  - ref: Hoang-Khang Du, & Hai-Ninh Do (2023). Sequential mediation analysis of workplace bullying, work-life conflict, and young employees’ outcomes in Vietnam. Asian Academy of Management Journal, 28(2), 61–86. https://doi.org/10.21315/aamj2023.28.2.3
  - model correction: Hoang-Khang Du, & Hai-Ninh Do. (2023). Sequential mediation analysis of workplace bullying, work-life conflict, and young employees’ outcomes in Vietnam. *Asian Academy of Management Journal*, *28*(2), 61–86. https://doi.org/10.21315/aamj2023.28.2.3
  - notes: The reference exists and is properly formatted according to APA 7th edition guidelines.
- **c12** truth=`corrected` predicted=`verified`
  - ref: Parsyan, A., Bhat, V., Athwal, H., Goebel, E. A., & Allan, A. L. (2025). Artemis and its role in cancer. *Translational Oncology*, *58*, 102165. https://doi.org/10.1016/j.tranon.2024.102165
  - model correction: Parsyan, A., Bhat, V., Athwal, H., Goebel, E. A., & Allan, A. L. (2025). Artemis and its role in cancer. *Translational Oncology*, *58*, 102165. https://doi.org/10.1016/j.tranon.2024.102165
  - notes: The paper exists and is formatted correctly according to APA 7th edition guidelines.
- **c13** truth=`corrected` predicted=`verified`
  - ref: eVenstra, S. C., & Jonkman, H. T. (2003). Energy‐level alignment at metal–organic and organic–organic interfaces. *Journal of Polymer Science Part B: Polymer Physics*, *41*(21), 2549–2560. https://doi.org/10.1002/polb.10658
  - model correction: Veenstra, S. C., & Jonkman, H. T. (2003). Energy‐level alignment at metal–organic and organic–organic interfaces. *Journal of Polymer Science Part B: Polymer Physics*, *41*(21), 2549–2560. https://doi.org/10.1002/polb.10658
  - notes: The reference exists, matches the correct source details, and is formatted properly according to APA 7th edition rules.
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: The reference appears to combine fictitious or mismatched author and title information into a simulated journal entry. While Journal of the Illuminating Engineering Institute of Japan exists, this specific article on incandescent and fluorescent lamps for preservation by these authors with a 302-page appendix cannot be verified.
- **c16** truth=`corrected` predicted=`verified`
  - ref: Klügl, F. (2006). Multiagentensimulation. Informatik-Spektrum, 29(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - model correction: Klügl, F. (2006). Multiagentensimulation. *Informatik-Spektrum*, *29*(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - notes: The reference exists, matches the published journal article, and is correctly formatted according to APA 7th edition.

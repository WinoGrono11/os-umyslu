# OS Umysłu

Minimalistyczna, lokalna przestrzeń do ogarniania myśli, dni i zadań.  
Stworzona z myślą o osobach z ADHD, autyzmem – i wszystkich, którzy potrzebują
prostego, cichego narzędzia zamiast kolejnej aplikacji „produktywności”.

To nie jest system, który Cię kontroluje.  
To miejsce, które **czeka aż z niego skorzystasz**.

---

## Co to jest?

OS Umysłu to:
- **dziennik** z automatyczną datą i godziną,
- **lista zadań** z checkboxami i punktami,
- **lokalny zapis danych** (bez kont, bez chmury, bez synchronizacji),
- możliwość **zapisu postępów do pliku** i wczytania ich później,
- pełne działanie **offline**, z pendrive’a lub przez GitHub Pages.

Nie ma tu presji.  
Nie ma „ciągów”.  
Nie ma powiadomień.

Jest tylko to, co wpiszesz.

---

## Jak działa zapis danych?

Dane są przechowywane:
- **tymczasowo** w `localStorage` przeglądarki (żeby nic nie zniknęło po odświeżeniu),
- **trwale** przez ręczny zapis do pliku `.json`.

### Przyciski:
- **„Koniec na dziś — zapisz ślad”**  
  → zapisuje dziennik, zadania i punkty do pliku  
  → plik trafia do folderu z `index.html` (np. na pendrive)

- **„Witam ponownie — wczytaj ślad”**  
  → wczytuje wcześniej zapisany plik  
  → wszystko wraca dokładnie tak, jak było

Dzięki temu projekt:
- działa na GitHub Pages,
- działa offline,
- nie wymaga backendu ani bazy danych.

---

## Struktura projektu
/

├─ index.html # struktura aplikacji

├─ style.css # wygląd i czytelność

└─ app.js # cała logika (dziennik, zadania, zapis)




To wszystko.  
Im mniej warstw, tym mniej rzeczy może się zepsuć.

---

## Dlaczego tak prosto?

Bo prostota:
- jest przewidywalna,
- nie przeciąża,
- daje poczucie kontroli.

Ten projekt nie próbuje być „lepszą wersją Ciebie”.  
On tylko **zostawia ślad**, że byłeś tu dziś.

---

## Dla kogo?

Dla każdego, kto:
- gubi myśli,
- nie chce kolejnej aplikacji,
- potrzebuje miejsca „bez oceny”,
- woli narzędzie niż system.

---

## Licencja / użycie

Projekt osobisty.  
Możesz go używać, modyfikować, kopiować dla siebie.

Jeśli komuś pomoże — to wystarczy.

---

## Na koniec

Jeśli to czytasz:
- to znaczy, że OS Umysłu działa,
- albo że właśnie go odkrywasz.

W obu przypadkach — powodzenia.  
I spokoju.


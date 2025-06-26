# AIMQ - Sistem bazat pe Inteligența Artificială pentru Generarea de Teste

**AIMQ** (AI Multiple Choice Question Generation System) este o platformă web modernă concepută pentru generarea automată de întrebări grilă din materiale educaționale, folosind tehnici avansate de inteligență artificială. Sistemul este destinat mediului universitar și are ca scop promovarea învățării active prin crearea de teste contextualizate și pedagogic valide.

### Caracteristici Principale:
- Generare automată de întrebări contextualizate din documente PDF
- Suport bilingv (română și engleză)
- Sistem de control al accesului bazat pe roluri (RBAC)
- Interfață intuitivă și responsive
- Tehnologii AI moderne (Google Gemini 2.0, LangChain, ChromaDB)


## Cerințe de Sistem

### Software Necesar:
- **Node.js** v16.0 sau mai recent
- **Python** v3.8 sau mai recent
- **MySQL** v8.0 sau mai recent
- **Git** pentru controlul versiunilor

## Pornire Aplicație

### 1. Pornirea Backend-ului:
```bash
cd mcq_backend
npm start
# Serverul va rula pe http://localhost:5000
```

### 2. Pornirea Frontend-ului:
```bash
cd mcq_frontend
npm start
# Aplicația va rula pe http://localhost:3000
```

### 3. Pornirea Microserviciului AI:
```bash
cd mcq_api
uvicorn main:app --reload --port 8000
# API-ul va rula pe http://localhost:8000
```

### Chei API:
- **Google Gemini API Key** - obținută de la [Google AI Studio](https://aistudio.google.com/)

### Porturi Care Trebuie Libere:
- **3000** - Frontend React.js
- **5000** - Backend Node.js Express
- **8000** - Serviciul AI FastAPI Python
- **3306** - Baza de date MySQL

## Instalare și Configurare

### 1. Clonarea Repository-ului

```bash
git clone https://github.com/georgi799/MCQ.git
cd MCQ
```

### 2. Configurarea Bazei de Date MySQL

#### Instalare MySQL:
```
# Windows
# Descărcați MySQL de la https://dev.mysql.com/downloads/mysql/
```

### 3. Configurarea Backend-ului (Node.js)

```bash
cd mcq_backend
npm install
```

#### Dependințe Backend:
- express ^5.1.0
- mysql2 ^3.14.1
- jsonwebtoken ^9.0.2
- bcryptjs ^3.0.2
- axios ^1.10.0
- multer ^2.0.0
- cors ^2.8.5
- dotenv ^16.5.0
- uuid ^11.1.0

### 4. Configurarea Frontend-ului (React.js)

```bash
cd ../mcq_frontend
npm install
```

#### Dependințe Frontend:
- react ^18.2.0
- react-router-dom ^6.8.1
- axios ^1.3.4
- tailwindcss ^3.2.7
- lucide-react ^0.263.1
- react-hot-toast ^2.4.0

### 5. Configurarea Microserviciului AI (Python)


#### Dependințe Python Principale:
```txt
fastapi==0.104.1
uvicorn==0.24.0
langchain==0.1.0
langchain-community==0.0.13
chromadb==0.4.18
sentence-transformers==2.2.2
transformers==4.36.0
torch==2.1.0
scikit-learn==1.3.2
keybert==0.8.0
tiktoken==0.5.2
mysql-connector-python==8.2.0
python-dotenv==1.0.0
google-generativeai==0.3.2
PyPDF2==3.0.1
```

## Configurare Variabile de Mediu

### Backend (.env în mcq_backend/):
```env
Este necesar crearea unui fișier de variabile de mediu pentru a putea rula proiectul (Gemini API, parametri de conexiune cu baza de date)
```




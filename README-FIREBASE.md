# Configuração do Firebase para o Projeto Hostel

Este documento contém instruções sobre como configurar o Firebase para o projeto Hostel.

## Problema de Permissões

Se você está recebendo erros como "Missing or insufficient permissions", isso significa que as regras de segurança do Firestore não estão configuradas corretamente.

## Solução

### Opção 1: Configurar Regras no Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/project/hostel-538d2/firestore/rules)
2. Navegue até "Firestore Database" > "Rules"
3. Substitua as regras atuais pelo conteúdo abaixo:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regra temporária para permitir acesso durante a fase de desenvolvimento
    // IMPORTANTE: REMOVER ANTES DE IR PARA PRODUÇÃO!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Clique em "Publish" (Publicar)

### Opção 2: Usar Firebase CLI

Se você tem o Firebase CLI instalado, você pode fazer o deploy das regras diretamente do terminal:

1. Instale o Firebase CLI (se ainda não tiver):
   ```
   npm install -g firebase-tools
   ```

2. Faça login no Firebase:
   ```
   firebase login
   ```

3. Inicialize o Firebase no projeto (se ainda não tiver):
   ```
   firebase init
   ```

4. Faça o deploy das regras:
   ```
   firebase deploy --only firestore:rules
   ```

## Configuração do Usuário Master

O sistema tentará criar automaticamente um usuário master para administração.

**IMPORTANTE:** Para ambientes de produção, modifique a senha do administrador no arquivo `src/scripts/setupMasterUser.ts` antes de fazer o deploy.

## Notas para Produção

Antes de fazer o deploy para produção, você deve:

1. Modificar a senha do usuário master para uma senha forte e segura
2. Remover as regras temporárias de permissão no Firestore e ativar as regras restritas em `src/config/firestore.rules`
3. Implantar as regras de segurança no Firebase Console

## Emuladores Locais (Opcional)

Para um ambiente de desenvolvimento totalmente local, você pode usar os emuladores do Firebase:

1. Instale o Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Inicie os emuladores:
   ```
   firebase emulators:start
   ```

3. Descomentar as linhas relevantes em `src/config/firebase.ts`:
   ```javascript
   connectAuthEmulator(auth, 'http://localhost:9099');
   connectFirestoreEmulator(firestore, 'localhost', 8080);
   connectFunctionsEmulator(functions, 'localhost', 5001);
   connectStorageEmulator(storage, 'localhost', 9199);
   ``` 
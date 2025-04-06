# Instruções para Resolver Problemas de Autenticação

Este documento contém instruções sobre como resolver os problemas de autenticação no projeto Hostel.

## Problemas Identificados

De acordo com os logs, foram identificados os seguintes problemas:

1. **Problemas com o usuário master**:
   - Já existe um usuário na Firebase Authentication (erro `auth/email-already-in-use`), mas o script está tendo problemas para fazer login com ele.
   - Quando o login é tentado, aparece um erro `User profile not found`, indicando que o usuário existe na autenticação, mas não há um documento correspondente no Firestore.

2. **Problemas com as regras do Firestore**:
   - Mensagens de erro como "Missing or insufficient permissions" indicam que as regras de segurança do Firestore não estão configuradas corretamente.

## Solução Implementada

Implementamos as seguintes melhorias para resolver esses problemas:

1. **Melhoria nas Regras do Firestore**:
   - Criadas regras temporárias que permitem acesso total durante o desenvolvimento (`allow read, write: if true;`).
   - Estas regras estão no arquivo `src/config/firestore.rules` e precisam ser publicadas no Firebase Console.

2. **Melhoria no Fluxo de Autenticação**:
   - O hook `useAuth` agora verifica se o usuário existe na autenticação mas não tem perfil, e cria um perfil básico automaticamente.
   - A função `createUserProfile` foi adicionada para criar perfis de usuários que já existem na autenticação.

3. **Melhoria no Setup do Usuário Master**:
   - Melhor tratamento de erros para verificar se o usuário master já existe.
   - Capacidade de recuperar o usuário mesmo quando há problemas com a senha.

## Instruções de Uso

### 1. Configurar as Regras do Firestore

1. Acesse o [Firebase Console](https://console.firebase.google.com/project/hostel-538d2/firestore/rules)
2. Navegue até "Firestore Database" > "Rules"
3. Substitua as regras pelo seguinte código:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regra temporária para permitir acesso durante o desenvolvimento
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Clique em "Publish" (Publicar)

### 2. Credenciais do Usuário Master

O sistema está configurado para criar/usar um usuário master.

### 3. Correção Manual de Problemas (se necessário)

Se ainda houver problemas, você pode:

#### Redefinir a Senha do Usuário Master

1. Acesse o [Firebase Console](https://console.firebase.google.com/project/hostel-538d2/authentication/users)
2. Encontre o usuário administrador
3. Clique no menu "..." e selecione "Reset Password"
4. Defina uma nova senha
5. Atualize o arquivo `src/scripts/setupMasterUser.ts` com a nova senha, se necessário

#### Criar Manualmente o Perfil no Firestore

1. Acesse o [Firebase Console](https://console.firebase.google.com/project/hostel-538d2/firestore/data)
2. Navegue até a coleção "users"
3. Encontre se já existe um documento com o ID do usuário master
4. Se não existir, crie um novo documento com o ID do usuário master (você pode obter este ID na seção Authentication do console)
5. Adicione os seguintes campos:
   - `id`: [ID do usuário]
   - `email`: [email do usuário]
   - `name`: "Super Admin"
   - `role`: "superadmin"
   - `points`: 0
   - `country`: "Brasil"
   - `age`: 30
   - `relationshipStatus`: "single"
   - `gender`: "other"
   - `phone`: ""
   - `arrivalDate`: [data atual em formato ISO]
   - `departureDate`: [data futura em formato ISO]
   - `createdAt`: [data atual em formato ISO]

6. Na coleção "system", crie um documento chamado "master" com os campos:
   - `userId`: [ID do usuário]
   - `email`: [email do usuário]
   - `createdAt`: [data atual em formato ISO]
   - `isMaster`: true

## Próximos Passos

Após resolver os problemas de autenticação e configuração, você poderá:

1. Registrar novos usuários
2. Fazer login com usuários existentes
3. Acessar o dashboard após autenticação
4. Gerenciar usuários como administrador

## Configuração para Produção

Antes de implantar em produção, não se esqueça de:

1. Alterar a senha do usuário master para uma senha forte e segura
2. Ativar as regras de segurança mais restritivas em `src/config/firestore.rules`
3. Implantar as regras de segurança no Firebase Console 
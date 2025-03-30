export const translations = {
  en: {
    // Common
    applicationName: 'Carcavelos Summer Beach',
    
    // Auth
    welcome: 'Welcome to Carcavelos Summer Beach',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    backToLogin: 'Back to Login',
    
    // User Information
    name: 'Name',
    country: 'Country',
    age: 'Age',
    relationshipStatus: 'Relationship Status',
    phone: 'Phone',
    arrivalDate: 'Arrival Date',
    departureDate: 'Departure Date',
    gender: 'Gender',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    
    // Relationship Status
    single: 'Single',
    dating: 'Dating',
    married: 'Married',
    
    // Gender
    male: 'Male',
    female: 'Female',
    other: 'Other',
    
    // Sections
    personalInfo: 'Personal Information',
    security: 'Security',
    contactInfo: 'Contact Information',
    personalDetails: 'Personal Details',
    stayDuration: 'Stay Duration',
    joinCommunity: 'Join Our Community',
    experienceMagic: 'Experience the magic of Carcavelos Summer Beach',
    
    // Error messages
    error: {
      required: 'All required fields must be filled',
      invalidCredentials: 'Invalid username or password',
      emailExists: 'This email is already in use',
      general: 'An error occurred. Please try again',
      wrongPassword: 'Incorrect password',
      userNotFound: 'User not found',
      tooManyAttempts: 'Too many failed attempts. Please try again later',
      profileNotFound: 'User profile not found. Please contact support',
      unauthorized: 'You are not authorized to perform this action',
      passwordsDoNotMatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      invalidEmail: 'Please enter a valid email address'
    },
    
    // Tasks
    taskManagement: 'Task Management',
    addTask: 'Add Task',
    taskTitle: 'Task title',
    description: 'Description',
    points: 'Points',
    priority: 'Priority',
    dueDate: 'Due Date',
    status: 'Status',
    assignedTo: 'Assigned To',
    createdBy: 'Created By',
    createdAt: 'Created At',
    tags: 'Tags',
    checklist: 'Checklist',
    comments: 'Comments',
    addComment: 'Add Comment',
    
    // Task Status
    todo: 'To Do',
    inProgress: 'In Progress',
    done: 'Done',
    
    // Task Priority
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    
    // Schedule
    schedule: {
      title: 'Schedule Management',
      assign: 'Assign Volunteer',
      remove: 'Remove Assignment',
      shifts: {
        morning: '08:00-10:00',
        midMorning: '10:00-13:00',
        afternoon: '13:00-16:00',
        evening: '16:00-19:00',
        night: '19:00-22:00'
      }
    },
    
    // Events
    events: {
      title: 'Events',
      addEvent: 'Add Event',
      eventTitle: 'Event Title',
      startDate: 'Start Date',
      endDate: 'End Date',
      location: 'Location',
      type: 'Type',
      capacity: 'Capacity',
      attendees: 'Attendees',
      organizer: 'Organizer',
      status: {
        upcoming: 'Upcoming',
        ongoing: 'Ongoing',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      types: {
        activity: 'Activity',
        invitation: 'Invitation'
      }
    },
    
    // Messages
    messages: {
      title: 'Messages',
      newMessage: 'New Message',
      sendMessage: 'Send Message',
      noMessages: 'No messages yet',
      typeMessage: 'Type a message...',
      attachments: 'Attachments',
      reactions: 'Reactions',
      read: 'Read',
      unread: 'Unread'
    },
    
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome, {name}!',
      welcomeMorning: 'Good morning, {name}!',
      welcomeAfternoon: 'Good afternoon, {name}!',
      welcomeEvening: 'Good evening, {name}!',
      currentShift: 'You are currently on shift: {shift}',
      currentShiftSimple: 'Current Shift',
      nextShift: 'Your next shift will be on {date} at {shift}',
      previousShift: 'Previous Shift',
      nextShiftSimple: 'Next Shift',
      daysOff: 'Your days off this week:',
      noShiftsScheduled: 'You have no shifts scheduled',
      noVolunteersAssigned: 'No volunteers assigned',
      you: 'You',
      stats: {
        tasks: 'Tasks',
        points: 'Points',
        events: 'Events',
        messages: 'Messages'
      },
      weather: {
        title: 'Current Conditions',
        temperature: 'Temperature',
        wind: 'Wind',
        waves: 'Waves',
        humidity: 'Humidity'
      },
      recentActivity: 'Recent Activity',
      upcomingEvents: 'Upcoming Events',
      pendingTasks: 'Pending Tasks'
    },
    
    // Settings
    settings: {
      title: 'Settings',
      notifications: {
        title: 'Notifications',
        email: 'Email Notifications',
        browser: 'Browser Notifications',
        tasks: 'Task Notifications',
        events: 'Event Notifications',
        schedule: 'Schedule Notifications'
      },
      preferences: {
        title: 'Preferences',
        language: 'Language',
        theme: 'Theme',
        timezone: 'Timezone',
        dateFormat: 'Date Format',
        timeFormat: 'Time Format'
      },
      privacy: {
        title: 'Privacy',
        showProfile: 'Show Profile',
        showPoints: 'Show Points',
        showActivity: 'Show Activity'
      }
    },
    
    // Roles
    roles: {
      admin: 'Admin',
      user: 'User',
      volunteer: 'Volunteer'
    },
    
    // Staff
    staff: {
      title: 'Staff Management',
      addUser: 'Add User',
      editUser: 'Edit Staff Member',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      role: 'Role',
      roles: {
        admin: 'Administrator',
        volunteer: 'Volunteer',
        user: 'User'
      },
      shifts: 'shifts',
      delete: 'Delete user',
      add: 'Add user',
      actions: 'Actions',
      makeAdmin: 'Make Admin',
      removeAdmin: 'Remove Admin',
      alerts: {
        onlyAdminEdit: 'Only administrators can change user roles.',
        onlyAdminDelete: 'Only administrators can delete users.',
        roleUpdated: 'User role updated successfully.',
        roleUpdateFailed: 'Failed to update user role.',
        userDeleted: 'User deleted successfully.',
        deleteUserFailed: 'Failed to delete user.',
        lastAdmin: 'Cannot remove the last administrator.',
        cantDeleteSelf: 'Administrators cannot delete themselves.',
        confirmDelete: 'Are you sure you want to delete this user? This action cannot be undone.',
        confirmMakeAdmin: 'Are you sure you want to make this staff member an administrator? They will have full access to all system features.',
        confirmRemoveAdmin: 'Are you sure you want to remove administrator privileges from this user?'
      }
    },
    
    // Common
    loading: 'Loading...',
    success: 'Success',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    more: 'More',
    less: 'Less',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    close: 'Close',
    refresh: 'Refresh'
  },
  pt: {
    // Common
    applicationName: 'Carcavelos Summer Beach',
    
    // Auth
    welcome: 'Bem-vindo ao Carcavelos Summer Beach',
    login: 'Entrar',
    register: 'Registrar',
    email: 'Email',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha',
    forgotPassword: 'Esqueceu a senha?',
    resetPassword: 'Redefinir Senha',
    backToLogin: 'Voltar para Login',
    
    // User Information
    name: 'Nome',
    country: 'País',
    age: 'Idade',
    relationshipStatus: 'Estado Civil',
    phone: 'Telefone',
    arrivalDate: 'Data de Chegada',
    departureDate: 'Data de Partida',
    gender: 'Gênero',
    submit: 'Enviar',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    
    // Relationship Status
    single: 'Solteiro(a)',
    dating: 'Namorando',
    married: 'Casado(a)',
    
    // Gender
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outro',
    
    // Sections
    personalInfo: 'Informações Pessoais',
    security: 'Segurança',
    contactInfo: 'Informações de Contato',
    personalDetails: 'Dados Pessoais',
    stayDuration: 'Período de Estadia',
    joinCommunity: 'Junte-se à Nossa Comunidade',
    experienceMagic: 'Experimente a magia de Carcavelos Summer Beach',
    
    // Error messages
    error: {
      required: 'Todos os campos obrigatórios devem ser preenchidos',
      invalidCredentials: 'Usuário ou senha inválidos',
      emailExists: 'Este email já está em uso',
      general: 'Ocorreu um erro. Por favor, tente novamente',
      wrongPassword: 'Senha incorreta',
      userNotFound: 'Usuário não encontrado',
      tooManyAttempts: 'Muitas tentativas falhas. Por favor, tente novamente mais tarde',
      profileNotFound: 'Perfil de usuário não encontrado. Por favor, contate o suporte',
      unauthorized: 'Você não está autorizado a realizar esta ação',
      passwordsDoNotMatch: 'As senhas não coincidem',
      passwordTooShort: 'A senha deve ter pelo menos 6 caracteres',
      invalidEmail: 'Por favor, insira um endereço de email válido'
    },
    
    // Tasks
    taskManagement: 'Gerenciamento de Tarefas',
    addTask: 'Adicionar Tarefa',
    taskTitle: 'Título da tarefa',
    description: 'Descrição',
    points: 'Pontos',
    priority: 'Prioridade',
    dueDate: 'Data de Entrega',
    status: 'Status',
    assignedTo: 'Atribuído a',
    createdBy: 'Criado por',
    createdAt: 'Criado em',
    tags: 'Tags',
    checklist: 'Lista de Verificação',
    comments: 'Comentários',
    addComment: 'Adicionar Comentário',
    
    // Task Status
    todo: 'A Fazer',
    inProgress: 'Em Andamento',
    done: 'Concluído',
    
    // Task Priority
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    
    // Schedule
    schedule: {
      title: 'Gerenciamento de Escala',
      assign: 'Atribuir Voluntário',
      remove: 'Remover Atribuição',
      shifts: {
        morning: '08:00-10:00',
        midMorning: '10:00-13:00',
        afternoon: '13:00-16:00',
        evening: '16:00-19:00',
        night: '19:00-22:00'
      }
    },
    
    // Events
    events: {
      title: 'Eventos',
      addEvent: 'Adicionar Evento',
      eventTitle: 'Título do Evento',
      startDate: 'Data de Início',
      endDate: 'Data de Término',
      location: 'Local',
      type: 'Tipo',
      capacity: 'Capacidade',
      attendees: 'Participantes',
      organizer: 'Organizador',
      status: {
        upcoming: 'Próximo',
        ongoing: 'Em Andamento',
        completed: 'Concluído',
        cancelled: 'Cancelado'
      },
      types: {
        activity: 'Atividade',
        invitation: 'Convite'
      }
    },
    
    // Messages
    messages: {
      title: 'Mensagens',
      newMessage: 'Nova Mensagem',
      sendMessage: 'Enviar Mensagem',
      noMessages: 'Nenhuma mensagem ainda',
      typeMessage: 'Digite uma mensagem...',
      attachments: 'Anexos',
      reactions: 'Reações',
      read: 'Lida',
      unread: 'Não lida'
    },
    
    // Dashboard
    dashboard: {
      title: 'Painel',
      welcome: 'Bem-vindo(a), {name}!',
      welcomeMorning: 'Bom dia, {name}!',
      welcomeAfternoon: 'Boa tarde, {name}!',
      welcomeEvening: 'Boa noite, {name}!',
      currentShift: 'Você está no seu turno atual: {shift}',
      currentShiftSimple: 'Turno Atual',
      nextShift: 'Seu próximo turno será em {date} às {shift}',
      previousShift: 'Turno Anterior',
      nextShiftSimple: 'Próximo Turno',
      daysOff: 'Seus dias de folga nesta semana:',
      noShiftsScheduled: 'Você não tem turnos agendados',
      noVolunteersAssigned: 'Nenhum voluntário designado',
      you: 'Você',
      stats: {
        tasks: 'Tarefas',
        points: 'Pontos',
        events: 'Eventos',
        messages: 'Mensagens'
      },
      weather: {
        title: 'Condições Atuais',
        temperature: 'Temperatura',
        wind: 'Vento',
        waves: 'Ondas',
        humidity: 'Umidade'
      },
      recentActivity: 'Atividade Recente',
      upcomingEvents: 'Próximos Eventos',
      pendingTasks: 'Tarefas Pendentes'
    },
    
    // Settings
    settings: {
      title: 'Configurações',
      notifications: {
        title: 'Notificações',
        email: 'Notificações por Email',
        browser: 'Notificações do Navegador',
        tasks: 'Notificações de Tarefas',
        events: 'Notificações de Eventos',
        schedule: 'Notificações de Escala'
      },
      preferences: {
        title: 'Preferências',
        language: 'Idioma',
        theme: 'Tema',
        timezone: 'Fuso Horário',
        dateFormat: 'Formato de Data',
        timeFormat: 'Formato de Hora'
      },
      privacy: {
        title: 'Privacidade',
        showProfile: 'Mostrar Perfil',
        showPoints: 'Mostrar Pontos',
        showActivity: 'Mostrar Atividade'
      }
    },
    
    // Roles
    roles: {
      admin: 'Administrador',
      user: 'Usuário',
      volunteer: 'Voluntário'
    },
    
    // Staff
    staff: {
      title: 'Gerenciamento de Equipe',
      addUser: 'Adicionar Usuário',
      editUser: 'Editar Membro da Equipe',
      name: 'Nome',
      email: 'Email',
      password: 'Senha',
      role: 'Função',
      roles: {
        admin: 'Administrador',
        volunteer: 'Voluntário',
        user: 'Usuário'
      },
      shifts: 'turnos',
      delete: 'Excluir usuário',
      add: 'Adicionar usuário',
      actions: 'Ações',
      makeAdmin: 'Tornar Administrador',
      removeAdmin: 'Remover Administrador',
      alerts: {
        onlyAdminEdit: 'Apenas administradores podem alterar funções de usuários.',
        onlyAdminDelete: 'Apenas administradores podem excluir usuários.',
        roleUpdated: 'Função do usuário atualizada com sucesso.',
        roleUpdateFailed: 'Falha ao atualizar função do usuário.',
        userDeleted: 'Usuário excluído com sucesso.',
        deleteUserFailed: 'Falha ao excluir usuário.',
        lastAdmin: 'Não é possível remover o último administrador.',
        cantDeleteSelf: 'Administradores não podem excluir a si mesmos.',
        confirmDelete: 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
        confirmMakeAdmin: 'Tem certeza que deseja tornar este membro da equipe um administrador? Ele terá acesso total a todos os recursos do sistema.',
        confirmRemoveAdmin: 'Tem certeza que deseja remover os privilégios de administrador deste usuário?'
      }
    },
    
    // Common
    loading: 'Carregando...',
    success: 'Sucesso',
    confirm: 'Confirmar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    more: 'Mais',
    less: 'Menos',
    all: 'Todos',
    none: 'Nenhum',
    yes: 'Sim',
    no: 'Não',
    ok: 'OK',
    close: 'Fechar',
    refresh: 'Atualizar'
  }
};
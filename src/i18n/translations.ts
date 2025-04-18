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
    quickLogin: 'Login with this account',
    useAnotherAccount: 'Use another account',
    quickLoginHint: 'Quick access with your saved credentials',
    rememberPassword: 'Remember password',
    
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
      invalidEmail: 'Please enter a valid email address',
      quickLoginFailed: 'Quick login failed. Please enter your password',
      titleTooShort: 'Title must be at least 3 characters',
      invalidPoints: 'Points must be a positive number',
      dueDateRequired: 'Due date is required'
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
    taskAdded: 'Task added successfully',
    taskUpdated: 'Task updated successfully',
    
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
      timeSlot: 'Time Slot',
      noVolunteers: 'No volunteers',
      selectVolunteer: 'Select Volunteer',
      summary: 'Summary',
      exceedLimitTitle: 'Exceeded shift limit',
      exceedLimitMessage: '{name} has already been added 5 times this week. Do you want to continue?',
      confirm: 'Confirm',
      cancel: 'Cancel',
      slots: {
        morning: '08:00-11:00',
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
      startConversation: 'Start a conversation by sending a message below',
      typeMessage: 'Type a message...',
      typePlaceholder: 'Type your message...',
      attachments: 'Attachments',
      attachment: 'Image attachment',
      reactions: 'Reactions',
      addReaction: 'Add reaction',
      addImage: 'Add image',
      read: 'Read',
      unread: 'Unread',
      clearAll: 'Clear all',
      confirmDeleteAll: 'Are you sure you want to delete all messages? This action cannot be undone.',
      imageTooLarge: 'Image is too large. Maximum size is 5MB.',
      imageUploadFailed: 'Failed to upload image. Please try again.',
      sending: 'Sending message...',
      sent: 'Message sent!',
      sendError: 'Failed to send message. Please try again.',
      uploadingImage: 'Uploading image...',
      imageUploaded: 'Image uploaded!',
      deleting: 'Deleting message...',
      deleted: 'Message deleted!',
      deleteError: 'Failed to delete message. Please try again.',
      clearingAll: 'Clearing all messages...',
      allCleared: 'All messages cleared!',
      clearError: 'Failed to clear messages. Please try again.'
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
      nextShift: 'Next shift: {date} at {shift}',
      previousShift: 'Previous Shift',
      lastActiveShift: 'Last Active Shift',
      nextShiftSimple: 'Next Shift',
      nextShiftWithVolunteers: 'Next Shift with Volunteers',
      daysOff: 'Your days off this week:',
      noShiftsScheduled: 'You have no shifts scheduled',
      noVolunteersAssigned: 'No volunteers assigned',
      you: 'You',
      todayTeam: "Today's Team",
      todaysTasks: "Today's Tasks",
      noTasks: "No tasks found",
      yourNextShift: "Your Next Shift",
      yourSchedule: "Your Schedule",
      dutyConfirmed: "Duty confirmed",
      noUpcomingShifts: "No upcoming shifts scheduled",
      noDaysOff: "No days off this week",
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
        windSpeed: 'Wind Speed',
        waves: 'Waves',
        waveHeight: 'Wave Height',
        humidity: 'Humidity'
      },
      recentActivity: 'Recent Activity',
      upcomingEvents: 'Upcoming Events',
      pendingTasks: 'Pending Tasks'
    },
    
    // Navigation
    navigation: {
      quickMenu: 'Quick Navigation',
      mainMenu: 'Main Menu',
      shortcuts: 'Shortcuts',
      actions: 'Actions',
      backToDashboard: 'Back to Dashboard',
      menu: 'Menu',
      items: {
        scheduleManagement: 'Schedule Management',
        tasks: 'Tasks',
        staffManagement: 'Staff Management',
        events: 'Events',
        messages: 'Messages',
        hostel: 'Hostel',
        points: 'Points',
        approvals: 'Approvals',
        settings: 'Settings',
        dashboard: 'Dashboard',
        schedule: 'Schedule',
        staff: 'Staff'
      },
      nav: {
        dashboard: 'Dashboard',
        schedule: 'Agenda',
        tasks: 'Tarefas',
        staff: 'Equipe',
        events: 'Eventos'
      }
    },
    
    // Admin
    admin: {
      title: 'Admin Panel',
      userManagement: 'User Management',
      systemSettings: 'System Settings',
      analytics: 'Analytics',
      logs: 'System Logs'
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
    
    // Laundry Schedule
    laundry: {
      title: 'Laundry Schedule',
      add: 'Add',
      staff: 'Staff',
      guest: 'Guest',
      addReservation: 'Add Reservation',
      guestName: 'Name',
      guestNamePlaceholder: 'Enter name...',
      isStaff: 'Is Staff/Hostel',
      slot: 'Time Slot',
      reservationSummary: 'You are reserving a laundry slot for:',
      nameRequired: 'Name is required',
      addingReservation: 'Adding {name} to {slot} slot...',
      reservationAdded: '{name} added to {slot} slot',
      removingReservation: 'Removing {name} from {slot} slot...',
      reservationRemoved: '{name} removed from {slot} slot',
      slots: {
        header: 'Time Slots',
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening'
      }
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
      userRegistered: 'User registered successfully!',
      registerFailed: 'Failed to register user',
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
    refresh: 'Refresh',
    today: 'Today',
    selectDate: 'Select date',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    logout: 'Logout',
    
    // Approval system
    approvals: {
      title: 'Approvals',
      photoApprovals: 'Photo Approvals',
      pendingPhotos: 'Pending Photos',
      approvePhoto: 'Approve Photo',
      rejectPhoto: 'Reject Photo',
      noPhotosPending: 'No photos pending approval',
      photoApproved: 'Photo approved successfully',
      photoRejected: 'Photo rejected',
      viewTask: 'View Task',
      taskTitle: 'Task',
      uploadedBy: 'Uploaded by',
      uploadedAt: 'Uploaded at',
      approvalRequired: 'Requires approval',
      photoRequired: 'Photo required',
      requirePhotoExplanation: 'When selected, this task can only be marked as done after a photo is submitted and approved',
      cannotComplete: 'This task requires an approved photo to be completed',
      takePhoto: 'Take Photo',
      uploadingPhoto: 'Uploading photo...',
      photoUploaded: 'Photo submitted for approval',
      waitingApproval: 'Waiting for approval',
      rejected: 'Rejected'
    },
    
    // Tasks
    tasks: {
      title: 'Tasks',
      management: 'Task Management',
      add: 'Add Task',
      list: 'Task List',
      noTasks: 'No tasks found',
      disabled: 'Tasks (disabled)'
    },
    
    // Points
    points: {
      title: 'Points',
      yourPoints: 'Your Points',
      history: 'Points History',
      earned: 'Points Earned',
      spent: 'Points Spent',
      balance: 'Points Balance',
      total: 'Total Points',
      noPoints: 'No points recorded',
      addPoints: 'Add Points',
      deductPoints: 'Deduct Points',
      pointsAdded: 'Points added successfully',
      pointsDeducted: 'Points deducted successfully',
      pointsError: 'Error updating points',
      leaderboard: 'Points Leaderboard',
      weeklyStats: 'Weekly Stats',
      monthlyStats: 'Monthly Stats',
      yearlyStats: 'Yearly Stats',
      rewards: 'Points Rewards',
      redeem: 'Redeem Points',
      transfer: 'Transfer Points',
      transferTo: 'Transfer Points to',
      transferFrom: 'Transfer Points from',
      transferSuccess: 'Points transferred successfully',
      transferError: 'Error transferring points',
      confirmTransfer: 'Confirm Transfer',
      cancelTransfer: 'Cancel Transfer',
      pointsRequired: 'Points Required',
      insufficientPoints: 'Insufficient Points',
      pointsAvailable: 'Points Available'
    },
    
    // Hostel
    hostel: {
      title: 'Hostel',
      management: 'Hostel Management',
      settings: 'Hostel Settings',
      info: 'Hostel Information'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close'
    },
    nav: {
      dashboard: 'Dashboard',
      schedule: 'Schedule',
      tasks: 'Tasks',
      staff: 'Staff',
      events: 'Events'
    }
  },
  pt: {
    // Common
    applicationName: 'Carcavelos Summer Beach',
    
    // Auth
    welcome: 'Bem-vindo ao Carcavelos Summer Beach',
    login: 'Entrar',
    register: 'Cadastrar',
    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha',
    forgotPassword: 'Esqueceu sua senha?',
    resetPassword: 'Redefinir Senha',
    backToLogin: 'Voltar ao Login',
    quickLogin: 'Entrar com esta conta',
    useAnotherAccount: 'Usar outra conta',
    quickLoginHint: 'Acesso rápido com suas credenciais salvas',
    rememberPassword: 'Lembrar senha',
    
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
      invalidCredentials: 'E-mail ou senha inválidos',
      emailExists: 'Este e-mail já está em uso',
      general: 'Ocorreu um erro. Por favor, tente novamente',
      wrongPassword: 'Senha incorreta',
      userNotFound: 'Usuário não encontrado',
      tooManyAttempts: 'Muitas tentativas falhas. Por favor, tente novamente mais tarde',
      profileNotFound: 'Perfil de usuário não encontrado. Por favor, contate o suporte',
      unauthorized: 'Você não está autorizado a realizar esta ação',
      passwordsDoNotMatch: 'As senhas não coincidem',
      passwordTooShort: 'A senha deve ter pelo menos 6 caracteres',
      invalidEmail: 'Por favor, insira um endereço de e-mail válido',
      quickLoginFailed: 'Login rápido falhou. Por favor, digite sua senha',
      titleTooShort: 'O título deve ter pelo menos 3 caracteres',
      invalidPoints: 'Os pontos devem ser um número positivo',
      dueDateRequired: 'A data de entrega é obrigatória'
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
    taskAdded: 'Tarefa adicionada com sucesso',
    taskUpdated: 'Tarefa atualizada com sucesso',
    
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
      timeSlot: 'Horário',
      noVolunteers: 'Sem voluntários',
      selectVolunteer: 'Selecionar Voluntário',
      summary: 'Resumo',
      exceedLimitTitle: 'Excedeu limite de turnos',
      exceedLimitMessage: '{name} já foi adicionado 5 vezes esta semana. Deseja continuar?',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      shifts: {
        morning: '08:00-11:00',
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
      startConversation: 'Inicie uma conversa enviando uma mensagem abaixo',
      typeMessage: 'Digite uma mensagem...',
      typePlaceholder: 'Digite sua mensagem...',
      attachments: 'Anexos',
      attachment: 'Anexo de imagem',
      reactions: 'Reações',
      addReaction: 'Adicionar reação',
      addImage: 'Adicionar imagem',
      read: 'Lida',
      unread: 'Não lida',
      clearAll: 'Limpar Tudo',
      confirmDeleteAll: 'Tem certeza que deseja excluir todas as mensagens? Esta ação não pode ser desfeita.',
      imageTooLarge: 'A imagem é muito grande. O tamanho máximo é 5MB.',
      imageUploadFailed: 'Falha ao fazer upload da imagem. Por favor, tente novamente.',
      sending: 'Enviando mensagem...',
      sent: 'Mensagem enviada!',
      sendError: 'Falha ao enviar mensagem. Por favor, tente novamente.',
      uploadingImage: 'Enviando imagem...',
      imageUploaded: 'Imagem enviada!',
      deleting: 'Excluindo mensagem...',
      deleted: 'Mensagem excluída!',
      deleteError: 'Falha ao excluir mensagem. Por favor, tente novamente.',
      clearingAll: 'Limpando todas as mensagens...',
      allCleared: 'Todas as mensagens foram limpas!',
      clearError: 'Falha ao limpar mensagens. Por favor, tente novamente.'
    },
    
    // Dashboard
    dashboard: {
      title: 'Painel',
      welcome: 'Bem-vindo(a), {name}!',
      welcomeMorning: 'Bom dia, {name}!',
      welcomeAfternoon: 'Boa tarde, {name}!',
      welcomeEvening: 'Boa noite, {name}!',
      currentShift: 'Você está no turno atual: {shift}',
      currentShiftSimple: 'Turno Atual',
      nextShift: 'Próximo turno: {date} às {shift}',
      previousShift: 'Turno Anterior',
      lastActiveShift: 'Último Turno Ativo',
      nextShiftSimple: 'Próximo Turno',
      nextShiftWithVolunteers: 'Próximo Turno com Voluntários',
      daysOff: 'Seus dias de folga nesta semana:',
      noShiftsScheduled: 'Você não tem turnos agendados',
      noVolunteersAssigned: 'Nenhum voluntário designado',
      you: 'Você',
      todayTeam: 'Equipe de Hoje',
      todaysTasks: 'Tarefas de Hoje',
      noTasks: 'Nenhuma tarefa encontrada',
      yourNextShift: 'Seu Próximo Turno',
      yourSchedule: 'Sua Agenda',
      dutyConfirmed: 'Turno confirmado',
      noUpcomingShifts: 'Nenhum turno agendado',
      noDaysOff: 'Nenhum dia de folga nesta semana',
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
        windSpeed: 'Velocidade do Vento',
        waves: 'Ondas',
        waveHeight: 'Altura das Ondas',
        humidity: 'Umidade'
      },
      recentActivity: 'Atividade Recente',
      upcomingEvents: 'Próximos Eventos',
      pendingTasks: 'Tarefas Pendentes'
    },
    
    // Navigation
    navigation: {
      quickMenu: 'Navegação Rápida',
      mainMenu: 'Menu Principal',
      shortcuts: 'Atalhos',
      actions: 'Ações',
      backToDashboard: 'Voltar ao Painel',
      menu: 'Menu',
      items: {
        scheduleManagement: 'Gerenciamento de Escala',
        tasks: 'Tarefas',
        staffManagement: 'Gerenciamento de Equipe',
        events: 'Eventos',
        messages: 'Mensagens',
        hostel: 'Hostel',
        points: 'Pontos',
        approvals: 'Aprovações',
        settings: 'Configurações',
        dashboard: 'Painel',
        schedule: 'Agenda',
        staff: 'Equipe'
      },
      nav: {
        dashboard: 'Dashboard',
        schedule: 'Agenda',
        tasks: 'Tarefas',
        staff: 'Equipe',
        events: 'Eventos'
      }
    },
    
    // Admin
    admin: {
      title: 'Painel de Administração',
      userManagement: 'Gerenciamento de Usuários',
      systemSettings: 'Configurações do Sistema',
      analytics: 'Análises',
      logs: 'Logs do Sistema'
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
    
    // Laundry Schedule
    laundry: {
      title: 'Agenda de Lavanderia',
      add: 'Adicionar',
      staff: 'Equipe',
      guest: 'Hóspede',
      addReservation: 'Adicionar Reserva',
      guestName: 'Nome',
      guestNamePlaceholder: 'Digite o nome...',
      isStaff: 'É membro da equipe',
      slot: 'Horário',
      reservationSummary: 'Você está reservando um horário para:',
      nameRequired: 'Nome é obrigatório',
      addingReservation: 'Adicionando {name} ao horário {slot}...',
      reservationAdded: '{name} adicionado(a) ao horário {slot}',
      removingReservation: 'Removendo {name} do horário {slot}...',
      reservationRemoved: '{name} removido(a) do horário {slot}',
      slots: {
        header: 'Horários',
        morning: 'Manhã',
        afternoon: 'Tarde',
        evening: 'Noite'
      }
    },
    
    // Staff
    staff: {
      title: 'Gerenciamento de Equipe',
      addUser: 'Adicionar Usuário',
      editUser: 'Editar Membro da Equipe',
      name: 'Nome',
      email: 'E-mail',
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
      userRegistered: 'Usuário cadastrado com sucesso!',
      registerFailed: 'Falha ao cadastrar usuário',
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
    refresh: 'Atualizar',
    today: 'Hoje',
    selectDate: 'Selecionar data',
    previousWeek: 'Semana anterior',
    nextWeek: 'Próxima semana',
    logout: 'Sair',
    
    // Sistema de aprovação
    approvals: {
      title: 'Aprovações',
      photoApprovals: 'Aprovação de Fotos',
      pendingPhotos: 'Fotos Pendentes',
      approvePhoto: 'Aprovar Foto',
      rejectPhoto: 'Rejeitar Foto',
      noPhotosPending: 'Nenhuma foto pendente de aprovação',
      photoApproved: 'Foto aprovada com sucesso',
      photoRejected: 'Foto rejeitada',
      viewTask: 'Ver Tarefa',
      taskTitle: 'Tarefa',
      uploadedBy: 'Enviada por',
      uploadedAt: 'Enviada em',
      approvalRequired: 'Requer aprovação',
      photoRequired: 'Foto obrigatória',
      requirePhotoExplanation: 'Quando selecionado, esta tarefa só pode ser marcada como concluída após uma foto ser enviada e aprovada',
      cannotComplete: 'Esta tarefa requer uma foto aprovada para ser concluída',
      takePhoto: 'Tirar Foto',
      uploadingPhoto: 'Enviando foto...',
      photoUploaded: 'Foto enviada para aprovação',
      waitingApproval: 'Aguardando aprovação',
      rejected: 'Rejeitada'
    },
    
    // Tasks
    tasks: {
      title: 'Tarefas',
      management: 'Gerenciamento de Tarefas',
      add: 'Adicionar Tarefa',
      list: 'Lista de Tarefas',
      noTasks: 'Nenhuma tarefa encontrada',
      disabled: 'Tarefas (desativado)'
    },
    
    // Points
    points: {
      title: 'Pontos',
      yourPoints: 'Seus Pontos',
      history: 'Histórico de Pontos',
      earned: 'Pontos Ganhos',
      spent: 'Pontos Gastos',
      balance: 'Saldo de Pontos',
      total: 'Total de Pontos',
      noPoints: 'Nenhum ponto registrado',
      addPoints: 'Adicionar Pontos',
      deductPoints: 'Deduzir Pontos',
      pointsAdded: 'Pontos adicionados com sucesso',
      pointsDeducted: 'Pontos deduzidos com sucesso',
      pointsError: 'Erro ao atualizar pontos',
      leaderboard: 'Ranking de Pontos',
      weeklyStats: 'Estatísticas Semanais',
      monthlyStats: 'Estatísticas Mensais',
      yearlyStats: 'Estatísticas Anuais',
      rewards: 'Recompensas de Pontos',
      redeem: 'Resgatar Pontos',
      transfer: 'Transferir Pontos',
      transferTo: 'Transferir Pontos para',
      transferFrom: 'Transferir Pontos de',
      transferSuccess: 'Pontos transferidos com sucesso',
      transferError: 'Erro ao transferir pontos',
      confirmTransfer: 'Confirmar Transferência',
      cancelTransfer: 'Cancelar Transferência',
      pointsRequired: 'Pontos Necessários',
      insufficientPoints: 'Pontos Insuficientes',
      pointsAvailable: 'Pontos Disponíveis'
    },
    
    // Hostel
    hostel: {
      title: 'Hostel',
      management: 'Gerenciamento do Hostel',
      settings: 'Configurações do Hostel',
      info: 'Informações do Hostel'
    },
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      cancel: 'Cancelar',
      save: 'Salvar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar'
    },
    nav: {
      dashboard: 'Dashboard',
      schedule: 'Agenda',
      tasks: 'Tarefas',
      staff: 'Equipe',
      events: 'Eventos'
    }
  }
};
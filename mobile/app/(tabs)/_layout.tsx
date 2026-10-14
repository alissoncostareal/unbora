import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarAccessibilityLabel: 'Início',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarAccessibilityLabel: 'Explorar',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
          title: 'Criar',
          tabBarAccessibilityLabel: 'Criar',
        }}
      />
      <Tabs.Screen
        name="ratings"
        options={{
          title: 'Passaporte',
          tabBarAccessibilityLabel: 'Passaporte',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notificações',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
          title: 'Favoritos',
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: null,
          title: 'Resultados',
        }}
      />
    </Tabs>
  );
}

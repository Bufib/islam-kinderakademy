import { Href, usePathname, useRouter } from 'expo-router';
import { PropsWithChildren, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { AppIcon, AppIconName } from '@/components/ui/app-icon';
import { AppText, Pill } from '@/components/ui/primitives';
import { Layout, Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types/academy';

type NavItem = {
  label: string;
  shortLabel?: string;
  icon: AppIconName;
  href: string;
  mobile?: boolean;
  adminOnly?: boolean;
};

const roleNavigation: Record<UserRole, NavItem[]> = {
  child: [
    { label: 'Übersicht', shortLabel: 'Start', icon: 'home', href: '/dashboard' },
    { label: 'Lernreisen', icon: 'journeys', href: '/lernreisen' },
    { label: 'Kalender', icon: 'calendar', href: '/kalender' },
    { label: 'Islam-Pass', shortLabel: 'Pass', icon: 'pass', href: '/islam-pass' },
  ],
  parent: [
    { label: 'Übersicht', shortLabel: 'Start', icon: 'home', href: '/dashboard' },
    { label: 'Meine Kinder', shortLabel: 'Kinder', icon: 'children', href: '/kinder' },
    { label: 'Kalender', icon: 'calendar', href: '/kalender' },
    { label: 'Mitteilungen', shortLabel: 'Postfach', icon: 'messages', href: '/mitteilungen' },
  ],
  team: [
    { label: 'Übersicht', shortLabel: 'Start', icon: 'dashboard', href: '/dashboard' },
    { label: 'Konten & Rollen', shortLabel: 'Konten', icon: 'profile', href: '/konten', adminOnly: true },
    { label: 'Curriculum', shortLabel: 'Plan', icon: 'curriculum', href: '/curriculum' },
    { label: 'Lektionen', icon: 'lessons', href: '/lektionen' },
    { label: 'Kalender', icon: 'calendar', href: '/kalender' },
    { label: 'Mitteilungen', shortLabel: 'Postfach', icon: 'messages', href: '/mitteilungen' },
    { label: 'Gruppen', icon: 'groups', href: '/gruppen', mobile: false },
    { label: 'Medien', icon: 'media', href: '/medien', mobile: false },
    { label: 'Abzeichen', icon: 'trophy', href: '/abzeichen', mobile: false },
    { label: 'Abgaben', icon: 'check', href: '/abgaben', mobile: false },
  ],
};

type RoleMeta = {
  label: string;
  description: string;
  icon: AppIconName;
  tone: 'mint' | 'sun' | 'sky' | 'coral';
};

const roleMeta: Record<UserRole, RoleMeta> = {
  child: {
    label: 'Kinderansicht',
    description: 'Lernen und Fortschritt',
    icon: 'profile',
    tone: 'sun',
  },
  parent: {
    label: 'Elternbereich',
    description: 'Begleiten und verwalten',
    icon: 'children',
    tone: 'mint',
  },
  team: {
    label: 'Team-Bereich',
    description: 'Programm und Inhalte',
    icon: 'dashboard',
    tone: 'sky',
  },
};

const adminRoleMeta: RoleMeta = {
  label: 'Administration',
  description: 'Konten und Plattform',
  icon: 'settings',
  tone: 'coral',
};

const pageTitles: Record<string, string> = {
  '/dashboard': 'Übersicht',
  '/lernreisen': 'Lernreisen',
  '/kalender': 'Kalender',
  '/islam-pass': 'Mein Islam-Pass',
  '/kinder': 'Meine Kinder',
  '/mitteilungen': 'Mitteilungen',
  '/curriculum': 'Curriculum',
  '/lektionen': 'Lektionen',
  '/lektion-neu': 'Neue Lektion',
  '/gruppen': 'Gruppen',
  '/medien': 'Medien',
  '/abzeichen': 'Abzeichen',
  '/abgaben': 'Abgaben',
  '/konten': 'Konten & Rollen',
  '/account': 'Mein Account',
};

const publicPaths = new Set(['/', '/login', '/register', '/passwort-vergessen']);

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { activeRole, exitChildArea } = useAcademy();
  const { profile } = useAuth();
  const router = useRouter();
  const desktop = width >= Layout.desktopBreakpoint;
  const isAdmin = activeRole === 'team' && profile?.role === 'admin';
  const currentRoleMeta = isAdmin ? adminRoleMeta : roleMeta[activeRole];
  const navItems = useMemo(
    () => roleNavigation[activeRole].filter((item) => !item.adminOnly || isAdmin),
    [activeRole, isAdmin]
  );

  if (publicPaths.has(pathname)) {
    return (
      <SafeAreaView style={styles.publicSafeArea} edges={['top', 'left', 'right']}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.app}>
        {desktop && (
          <Sidebar
            meta={currentRoleMeta}
            navItems={navItems}
            pathname={pathname}
            accountLabel={activeRole === 'child' ? 'Zum Elternbereich' : 'Mein Account'}
            onOpenAccount={() => {
              if (activeRole === 'child') {
                exitChildArea();
                router.replace('/dashboard' as Href);
              } else {
                router.push('/account' as Href);
              }
            }}
          />
        )}

        <View style={styles.main}>
          <TopBar
            compact={!desktop}
            pageTitle={pathname.startsWith('/lektion/') ? 'Lektion' : pathname.startsWith('/mitteilung/') ? 'Mitteilung' : pageTitles[pathname] ?? 'Islam-Kinderakademie'}
            meta={currentRoleMeta}
            onOpenAccount={() => {
              if (activeRole === 'child') {
                exitChildArea();
                router.replace('/dashboard' as Href);
              } else {
                router.push('/account' as Href);
              }
            }}
            onOpenNotifications={() => router.push('/mitteilungen' as Href)}
          />
          <View style={styles.routeContent}>{children}</View>
        </View>

        {!desktop && (
          <MobileNavigation
            navItems={navItems}
            pathname={pathname}
            bottomInset={insets.bottom}
          />
        )}
      </View>

    </SafeAreaView>
  );
}

function Sidebar({
  meta,
  navItems,
  pathname,
  accountLabel,
  onOpenAccount,
}: {
  meta: RoleMeta;
  navItems: NavItem[];
  pathname: string;
  accountLabel: string;
  onOpenAccount: () => void;
}) {
  return (
    <View style={styles.sidebar}>
      <BrandMark inverse />

      <View style={styles.sidebarNav}>
        <AppText variant="label" color={Palette.mintStrong} style={styles.navLabel}>
          Navigation
        </AppText>
        {navItems.map((item) => (
          <NavigationLink key={item.href} item={item} active={isPathActive(pathname, item.href)} />
        ))}
      </View>

      <View style={styles.sidebarBottom}>
        <View style={styles.prototypeNote}>
          <View style={styles.prototypeIcon}>
            <AppIcon name="lock" size={17} color={Palette.sun} />
          </View>
          <View style={styles.prototypeCopy}>
            <AppText variant="small" color={Palette.white} style={styles.prototypeTitle}>
              Geschützter Bereich
            </AppText>
            <AppText variant="small" color={Palette.mintStrong}>
              Mit Supabase verbunden
            </AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpenAccount}
          style={({ pressed }) => [styles.sidebarRole, pressed && styles.pressed]}>
          <View style={styles.roleAvatar}>
            <AppIcon name={meta.icon} size={20} color={Palette.ink} />
          </View>
          <View style={styles.roleCopy}>
            <AppText variant="bodyStrong" color={Palette.white} numberOfLines={1}>
              {meta.label}
            </AppText>
            <AppText variant="small" color={Palette.mintStrong} numberOfLines={1}>
              {accountLabel}
            </AppText>
          </View>
          <AppIcon name="more" size={20} color={Palette.mintStrong} />
        </Pressable>
      </View>
    </View>
  );
}

function NavigationLink({ item, active }: { item: NavItem; active: boolean }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(item.href as Href)}
      style={({ pressed }) => [
        styles.navItem,
        active && styles.navItemActive,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.navIcon, active && styles.navIconActive]}>
        <AppIcon
          name={item.icon}
          size={20}
          color={active ? Palette.ink : Palette.mintStrong}
        />
      </View>
      <AppText
        variant="bodyStrong"
        color={active ? Palette.white : '#D7E7DF'}
        style={styles.navItemText}>
        {item.label}
      </AppText>
      {active && <View style={styles.activeDot} />}
    </Pressable>
  );
}

function TopBar({
  compact,
  pageTitle,
  meta,
  onOpenAccount,
  onOpenNotifications,
}: {
  compact: boolean;
  pageTitle: string;
  meta: RoleMeta;
  onOpenAccount: () => void;
  onOpenNotifications: () => void;
}) {
  return (
    <View style={[styles.topBar, compact && styles.topBarCompact]}>
      {compact ? <BrandMark compact /> : <AppText variant="bodyStrong">{pageTitle}</AppText>}
      <View style={styles.topActions}>
        {!compact && <Pill tone={meta.tone}>{meta.label}</Pill>}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mitteilungen öffnen"
          onPress={onOpenNotifications}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <AppIcon name="bell" size={20} color={Palette.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mein Account öffnen"
          onPress={onOpenAccount}
          style={({ pressed }) => [styles.topAvatar, pressed && styles.pressed]}>
          <AppIcon name={meta.icon} size={20} color={Palette.ink} />
        </Pressable>
      </View>
    </View>
  );
}

function MobileNavigation({
  navItems,
  pathname,
  bottomInset,
}: {
  navItems: NavItem[];
  pathname: string;
  bottomInset: number;
}) {
  const router = useRouter();

  return (
    <View style={[styles.mobileNav, { paddingBottom: Math.max(bottomInset, 8) }]}>
      {navItems.filter((item) => item.mobile !== false).map((item) => {
        const active = isPathActive(pathname, item.href);
        return (
          <Pressable
            key={item.href}
            accessibilityRole="link"
            onPress={() => router.push(item.href as Href)}
            style={({ pressed }) => [styles.mobileNavItem, pressed && styles.pressed]}>
            <View style={[styles.mobileNavIcon, active && styles.mobileNavIconActive]}>
              <AppIcon
                name={item.icon}
                size={19}
                color={active ? Palette.white : Palette.muted}
              />
            </View>
            <AppText
              variant="small"
              color={active ? Palette.forest : Palette.muted}
              numberOfLines={1}
              style={styles.mobileNavLabel}>
              {item.shortLabel ?? item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const styles = StyleSheet.create({
  publicSafeArea: {
    flex: 1,
    width: '100%',
    backgroundColor: Palette.cream,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: Palette.forestDark,
    overflow: 'hidden',
  },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    flexDirection: 'row',
    backgroundColor: Palette.cream,
  },
  sidebar: {
    width: Layout.sidebarWidth,
    backgroundColor: Palette.forestDark,
    paddingHorizontal: Space.xl,
    paddingTop: Space.xl,
    paddingBottom: Space.lg,
  },
  sidebarNav: {
    marginTop: 46,
    gap: 7,
  },
  navLabel: {
    marginLeft: 12,
    marginBottom: Space.sm,
  },
  navItem: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: Radius.medium,
    gap: Space.md,
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: {
    backgroundColor: Palette.sun,
  },
  navItemText: {
    flex: 1,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.sun,
  },
  sidebarBottom: {
    marginTop: 'auto',
    gap: Space.md,
  },
  prototypeNote: {
    flexDirection: 'row',
    gap: Space.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: Radius.medium,
    padding: Space.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  prototypeIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(242,201,109,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prototypeCopy: {
    flex: 1,
  },
  prototypeTitle: {
    fontWeight: '700',
  },
  sidebarRole: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.09)',
    paddingTop: Space.md,
  },
  roleAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: Palette.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCopy: {
    flex: 1,
  },
  main: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  routeContent: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  topBar: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.xxl,
    backgroundColor: Palette.paper,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
    zIndex: 2,
  },
  topBarCompact: {
    height: 64,
    paddingHorizontal: Space.lg,
    width: '100%',
    maxWidth: '100%',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "center",
    gap: Space.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.white,
  },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Palette.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: Palette.paper,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    shadowColor: '#173D3A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    zIndex: 10,
  },
  mobileNavItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
  },
  mobileNavIcon: {
    width: 36,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileNavIconActive: {
    backgroundColor: Palette.forest,
  },
  mobileNavLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Palette.paper,
    borderRadius: Radius.xLarge,
    padding: Space.xl,
    shadowColor: Palette.ink,
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  notificationCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Palette.paper,
    borderRadius: Radius.xLarge,
    padding: Space.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.lg,
  },
  modalHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#EEF1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptions: {
    marginTop: Space.xl,
    gap: Space.sm,
  },
  roleOption: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    padding: Space.md,
  },
  roleOptionSelected: {
    borderColor: Palette.mintStrong,
    backgroundColor: '#F0F7F3',
  },
  roleOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionIconSelected: {
    backgroundColor: Palette.forest,
  },
  roleOptionCopy: {
    flex: 1,
  },
  notificationEmpty: {
    alignItems: 'center',
    minHeight: 230,
    justifyContent: 'center',
    paddingHorizontal: Space.xl,
  },
  notificationEmptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.md,
  },
  centerText: {
    textAlign: 'center',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.72,
  },
});

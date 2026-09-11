import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import AppShell from "../../components/app/AppShell.vue";

const stubMatchMedia = (desktop: boolean) => {
  window.matchMedia = ((query: string) => {
    const matches = desktop && query.includes("min-width: 1024px");
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  }) as typeof window.matchMedia;
};

describe("AppShell", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    document.body.style.overflow = "";
  });

  it("zeigt Mobile-Topbar und öffnet den Overlay-Drawer", async () => {
    const wrapper = mount(AppShell, {
      slots: { default: "<p>Inhalt</p>" },
      global: {
        stubs: {
          Sidebar: {
            template: '<nav id="app-sidebar">Nav</nav>',
            methods: { focusSearch() {} },
          },
          UiIcon: true,
          IconFabrikSonntagLogo: true,
        },
      },
    });

    await flushPromises();
    await nextTick();

    const menu = wrapper.get('button[aria-label="Menü öffnen"]');
    expect(menu.attributes("aria-expanded")).toBe("false");
    expect(wrapper.text()).toContain("Inhalt");

    await menu.trigger("click");
    await nextTick();

    expect(menu.attributes("aria-expanded")).toBe("true");
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true);

    await wrapper.get('[aria-hidden="true"]').trigger("click");
    await nextTick();

    expect(menu.attributes("aria-expanded")).toBe("false");
    wrapper.unmount();
  });
});

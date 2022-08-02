import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { WINDOW } from 'app/helpers/window.helper';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import { DialogService } from 'app/services';

describe('OauthProviderComponent', () => {
  let spectator: Spectator<OauthProviderComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: OauthProviderComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      {
        provide: WINDOW,
        useValue: {
          location: {
            toString: () => 'http://localhost',
          },
          open: jest.fn() as Window['open'],
          addEventListener: jest.fn((_, oAuthCallback: (message: OauthMessage) => void) => {
            oAuthCallback({
              data: {
                oauth_portal: true,
                result: {
                  client_id: 'id1234',
                  client_secret: 'secret1234',
                  token: 'token1234',
                },
              },
            } as OauthMessage);
          }) as Window['addEventListener'],
          removeEventListener: jest.fn() as Window['removeEventListener'],
        } as Window,
      },
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        oauthUrl: 'https://oauth.example.com',
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens a modal with authentication flow when Log In To Provider is pressed', async () => {
    const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Provider' }));
    await loginButton.click();

    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith(
      'https://oauth.example.com?origin=http%3A%2F%2Flocalhost%2F',
      '_blank',
      'width=640,height=480',
    );
    expect(spectator.inject<Window>(WINDOW).addEventListener).toHaveBeenCalledWith(
      'message',
      spectator.component.onOauthMessage,
      false,
    );
  });

  it('updates form with client_id and client_secret when oAuth callback is called', async () => {
    const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Provider' }));
    await loginButton.click();

    const form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'OAuth Client ID': 'id1234',
      'OAuth Client Secret': 'secret1234',
    });
  });

  it('emits (authenticated) output with response data when oAuth callback is called', async () => {
    const authenticatedOutput = jest.fn();
    spectator.component.authenticated.subscribe(authenticatedOutput);

    const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Provider' }));
    await loginButton.click();

    expect(authenticatedOutput).toHaveBeenCalledWith({
      client_id: 'id1234',
      client_secret: 'secret1234',
      token: 'token1234',
    });
  });

  it('calls removeEventListener when oAuth callback is called', async () => {
    const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Provider' }));
    await loginButton.click();

    expect(spectator.inject<Window>(WINDOW).removeEventListener)
      .toHaveBeenCalledWith('message', spectator.component.onOauthMessage);
  });
});

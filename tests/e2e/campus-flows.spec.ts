import { test, expect } from '@playwright/test';

test.describe('CampusEdge Public & Institutional E2E Journeys', () => {
  test('homepage renders hero, institutional metrics, curriculum pillars, and navigation', async ({
    page,
  }) => {
    await page.goto('/');

    // Hero title check
    await expect(
      page.getByRole('heading', { name: /Ex-FAANG Placement Training for Engineering Colleges/i })
    ).toBeVisible();

    // Verify key metrics
    await expect(page.getByText('72.4%')).toBeVisible();
    await expect(page.getByText('50%+')).toBeVisible();

    // Verify key CTAs
    const demoCta = page.getByRole('link', { name: /Request Demo Proposal/i }).first();
    await expect(demoCta).toBeVisible();
    await expect(demoCta).toHaveAttribute('href', '/demo');

    const testCta = page.getByRole('link', { name: /Student Diagnostic Test/i }).first();
    await expect(testCta).toBeVisible();
    await expect(testCta).toHaveAttribute('href', '/assessment');
  });

  test('TPO demo & proposal request flow registers lead successfully', async ({ page }) => {
    await page.goto('/demo');

    // Heading verification
    await expect(
      page.getByRole('heading', { name: /Request a Free Demo \/ Institutional Proposal/i })
    ).toBeVisible();

    // Fill form fields
    await page.getByPlaceholder('e.g. Vidyapeeth Institute of Technology').fill('Sardar Patel Institute of Technology');
    await page.getByPlaceholder('e.g. Pune, Mangaluru, Coimbatore').fill('Mumbai');
    await page.locator('select').first().selectOption('Maharashtra');
    await page.getByPlaceholder('e.g. Dr. K. S. Sharma').fill('Prof. Sudhir Mehta');
    await page.getByPlaceholder('tpo@college.edu.in / principal@').fill(`tpo_${Date.now()}@spit.ac.in`);
    await page.getByPlaceholder('+91 98XXX XXXXX').fill('+91 98201 12345');
    await page.getByPlaceholder('e.g. 240').fill('200');
    await page.getByPlaceholder('e.g. 3rd Year (Sem 5 & 6)').fill('3rd Year (Batch 2026)');
    await page.getByPlaceholder('e.g. CSE, IT, ECE, MCA').fill('Computer Engineering, IT');
    await page.getByPlaceholder('e.g. DSA Accelerator + Speed Aptitude').fill('DSA Accelerator + Speed Aptitude + Mock Interviews');

    // Submit form
    await page.getByRole('button', { name: /Submit Proposal Request/i }).click();

    // Expect success screen
    await expect(
      page.getByRole('heading', { name: /Proposal Request Received!/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sardar Patel Institute of Technology')).toBeVisible();
    await expect(page.getByText('Prof. Sudhir Mehta')).toBeVisible();
  });

  test('student 20-question diagnostic assessment flow evaluates score and section breakdown', async ({
    page,
  }) => {
    await page.goto('/assessment');

    // Test overview page
    await expect(
      page.getByRole('heading', { name: /Student Employability Diagnostic Assessment/i })
    ).toBeVisible();

    // Student Registration
    await page.getByPlaceholder('e.g. Aditya Sharma').fill('Rohan Joshi');
    await page.getByPlaceholder('e.g. rohan@college.edu.in').fill(`rohan_${Date.now()}@spit.ac.in`);
    await page.getByPlaceholder('+91 98XXX XXXXX').fill('+91 98765 43210');
    await page.getByPlaceholder('e.g. Vidyapeeth Institute of Technology').fill('Sardar Patel Institute of Technology');

    // Click Start Assessment
    await page.getByRole('button', { name: /Start 20-Question Diagnostic Assessment/i }).click();

    // Expect question screen to load
    await expect(page.getByText(/Question 1 of 20/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Time Remaining/i)).toBeVisible();

    // Select option A (index 0) for Question 1
    const firstOption = page.locator('button:has-text("A.")').first();
    await firstOption.click();

    // Navigate to Question 2
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText(/Question 2 of 20/i)).toBeVisible();

    // Submit assessment early using the top Submit button
    await page.getByRole('button', { name: /Submit Test/i }).first().click();

    // Verify submission modal appears and confirm
    await expect(page.getByText(/Ready to Submit Assessment\?/i)).toBeVisible();
    await page.getByRole('button', { name: /Yes, Submit & Calculate Results/i }).click();

    // Verify results page is rendered
    await expect(page.getByText(/Employability Diagnostic Report/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Quantitative Aptitude/i)).toBeVisible();
    await expect(page.getByText(/Logical Reasoning/i)).toBeVisible();
    await expect(page.getByText(/Verbal Ability/i)).toBeVisible();
    await expect(page.getByText(/Core DSA/i)).toBeVisible();
  });

  test('all institutional marketing pages load cleanly', async ({ page }) => {
    // Programs page
    await page.goto('/programs');
    await expect(page.getByRole('heading', { name: /Placement-Focused Curriculum & Syllabi/i })).toBeVisible();
    await expect(page.getByText(/16-Week Zero-to-Hero DSA Track/i)).toBeVisible();

    // Packages page
    await page.goto('/packages');
    await expect(page.getByRole('heading', { name: /Transparent Institutional Packages & Delivery Models/i })).toBeVisible();
    await expect(page.getByText('Foundation Track')).toBeVisible();
    await expect(page.getByText('Placement-Ready Accelerator')).toBeVisible();
    await expect(page.getByText('Premium Mentorship')).toBeVisible();

    // How It Works page
    await page.goto('/how-it-works');
    await expect(page.getByRole('heading', { name: /How CampusEdge Partners with Your College/i })).toBeVisible();

    // FAQ page
    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: /Frequently Asked Questions/i })).toBeVisible();

    // Contact page
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: /Get in Touch with Our Institutional Team/i })).toBeVisible();
    await expect(page.getByText('dj0791463@gmail.com')).toBeVisible();
  });
});
